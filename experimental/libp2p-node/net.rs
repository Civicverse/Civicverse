// src/net.rs
use anyhow::{Context, Result};
use futures::prelude::*;
use libp2p::{
    core::upgrade,
    gossipsub::{Gossipsub, GossipsubConfigBuilder, GossipsubEvent, IdentTopic as Topic, MessageAuthenticity},
    identity, mdns::{Mdns, MdnsEvent},
    noise::NoiseConfig,
    swarm::{Swarm, SwarmEvent},
    tcp::TokioTcpConfig,
    yamux::YamuxConfig,
    Transport,
};
use libp2p::PeerId;
use std::time::Duration;
use tokio::sync::{broadcast, mpsc::unbounded_channel, mpsc::UnboundedSender};
use std::sync::Arc;

/// A network abstraction for the Civicverse node.
///
/// - `publish(topic, data)` publishes to gossipsub.
/// - `subscribe()` returns a `broadcast::Receiver<Vec<u8>>` that receives inbound gossipsub payloads.
///
/// Notes:
/// - inbound payloads are raw `Vec<u8>` from gossipsub message.data. Modules must deserialize/verify them.
/// - broadcast channel buffer size chosen as 1024; tune if you expect bursts.
pub struct NodeNetwork {
    pub peer_id: PeerId,
    pub gossipsub_topic: Topic,
    tx_publish: UnboundedSender<(String, Vec<u8>)>,
    tx_inbound: broadcast::Sender<Vec<u8>>,
}

impl NodeNetwork {
    /// Create a new NodeNetwork, listening on `listen_port`.
    /// If `secret_b64` is Some(base64_key) we derive an ed25519 keypair from it (dev reproducible); otherwise a random identity is used.
    pub async fn new(listen_port: u16, secret_b64: Option<String>) -> Result<Self> {
        // build identity keypair
        let id_keys = match secret_b64 {
            Some(s) => {
                // base64 of ed25519 keypair bytes (as used by ed25519_from_bytes)
                let bytes = base64::engine::general_purpose::STANDARD.decode(s.as_bytes()).context("decoding secret base64")?;
                identity::Keypair::ed25519_from_bytes(&bytes).context("ed25519_from_bytes")?
            }
            None => identity::Keypair::generate_ed25519(),
        };

        let peer_id = PeerId::from(id_keys.public());
        log::info!("Local peer id: {}", peer_id);

        // transport stack: tcp + noise + yamux
        let noise = NoiseConfig::xx(&id_keys).context("building noise")?;
        let transport = TokioTcpConfig::new().nodelay(true)
            .upgrade(upgrade::Version::V1)
            .authenticate(noise)
            .multiplex(YamuxConfig::default())
            .boxed();

        // gossipsub config
        let gossipsub_config = GossipsubConfigBuilder::default()
            .heartbeat_interval(Duration::from_secs(10))
            .build()
            .expect("gossipsub config");

        let mut gossipsub: Gossipsub = Gossipsub::new(MessageAuthenticity::Signed(id_keys.clone()), gossipsub_config)
            .context("create gossipsub")?;

        let topic = Topic::new("civicverse-attestations");
        gossipsub.subscribe(&topic).context("subscribe topic")?;

        // mdns for local discovery
        let mdns = Mdns::new(Default::default()).await.context("create mdns")?;

        // composite behaviour
        #[derive(libp2p::swarm::NetworkBehaviour)]
        #[behaviour(out_event = "BehaviourEvent")]
        struct Behaviour {
            gossipsub: Gossipsub,
            mdns: Mdns,
        }

        #[allow(clippy::large_enum_variant)]
        enum BehaviourEvent {
            Gossipsub(GossipsubEvent),
            Mdns(MdnsEvent),
        }

        impl From<GossipsubEvent> for BehaviourEvent {
            fn from(e: GossipsubEvent) -> Self { BehaviourEvent::Gossipsub(e) }
        }
        impl From<MdnsEvent> for BehaviourEvent {
            fn from(e: MdnsEvent) -> Self { BehaviourEvent::Mdns(e) }
        }

        let behaviour = Behaviour { gossipsub, mdns };

        let mut swarm = Swarm::with_tokio_executor(transport, behaviour, peer_id);

        let listen_addr = format!("/ip4/0.0.0.0/tcp/{}", listen_port).parse().expect("parse listen addr");
        Swarm::listen_on(&mut swarm, listen_addr).context("Swarm listen_on")?;

        // outgoing publish channel
        let (tx_publish, mut rx_publish) = unbounded_channel::<(String, Vec<u8>)>();

        // inbound broadcast channel for dispatching message.data to subscribers
        let (tx_inbound, _rx_inbound) = broadcast::channel::<Vec<u8>>(1024);

        // Spawn the reactor loop
        tokio::spawn(async move {
            loop {
                tokio::select! {
                    // outgoing publish requests from other modules
                    Some((topic_str, data)) = rx_publish.recv() => {
                        let topic = Topic::new(topic_str);
                        // gossipsub publish returns MessageId or Err; we ignore the id but warn on err
                        if let Err(e) = swarm.behaviour_mut().gossipsub.publish(topic, data) {
                            log::warn!("gossipsub publish error: {:?}", e);
                        }
                    }

                    // libp2p swarm events
                    event = swarm.select_next_some() => {
                        match event {
                            SwarmEvent::Behaviour(beh_event) => {
                                match beh_event {
                                    BehaviourEvent::Mdns(mdns_ev) => {
                                        match mdns_ev {
                                            MdnsEvent::Discovered(list) => {
                                                for (peer, multiaddrs) in list {
                                                    log::info!("mDNS discovered: {} {:?}", peer, multiaddrs);
                                                }
                                            }
                                            MdnsEvent::Expired(list) => {
                                                for (peer, _addrs) in list {
                                                    log::info!("mDNS expired: {}", peer);
                                                }
                                            }
                                        }
                                    }
                                    BehaviourEvent::Gossipsub(gs_ev) => {
                                        // handle gossipsub events; extract messages and forward payload
                                        match gs_ev {
                                            GossipsubEvent::Message { propagation_source: _src, message_id: _id, message } => {
                                                // message.data is Vec<u8>
                                                let payload = message.data;
                                                // try to broadcast; ignore error if no subscribers
                                                let _ = tx_inbound.send(payload);
                                            }
                                            other => {
                                                log::debug!("gossipsub event: {:?}", other);
                                            }
                                        }
                                    }
                                }
                            }

                            SwarmEvent::NewListenAddr { address, .. } => {
                                log::info!("Listening on {}", address);
                            }

                            _other => {
                                // ignore other events or log at debug
                                // log::debug!("swarm event: {:?}", _other);
                            }
                        }
                    }
                }
            }
        });

        Ok(Self {
            peer_id,
            gossipsub_topic: topic,
            tx_publish,
            tx_inbound,
        })
    }

    /// Publish `data` on `topic` (gossipsub)
    pub fn publish(&self, topic: &str, data: Vec<u8>) -> Result<()> {
        self.tx_publish
            .send((topic.to_string(), data))
            .context("send publish request")
    }

    /// Subscribe to inbound gossipsub payloads (raw `Vec<u8>`).
    /// Each subscriber receives a `broadcast::Receiver<Vec<u8>>`. Clone the receiver to hand off.
    ///
    /// Example:
    /// ```
    /// let mut rx = network.subscribe();
    /// tokio::spawn(async move {
    ///   while let Ok(payload) = rx.recv().await {
    ///     // handle payload bytes
    ///   }
    /// });
    /// ```
    pub fn subscribe(&self) -> broadcast::Receiver<Vec<u8>> {
        self.tx_inbound.subscribe()
    }
}
