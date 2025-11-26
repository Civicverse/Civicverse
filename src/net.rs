use anyhow::{Result, Context};
use libp2p::{identity, PeerId};
use libp2p::gossipsub::{Gossipsub, GossipsubConfigBuilder, MessageAuthenticity, GossipsubEvent, IdentTopic as Topic, GossipsubMessage};
use libp2p::mdns::{Mdns, MdnsEvent};
use libp2p::swarm::{Swarm, SwarmEvent};
use libp2p::tcp::TokioTcpConfig;
use libp2p::noise::{NoiseConfig, X25519Spec, Keypair as NoiseKeypair};
use libp2p::yamux::YamuxConfig;
use libp2p::Transport;
use libp2p::core::upgrade;
use std::time::Duration;
use tokio::sync::mpsc::{UnboundedSender, UnboundedReceiver, unbounded_channel};
use std::sync::Arc;
use futures::prelude::*;

pub type MsgTx = UnboundedSender<(String, Vec<u8>)>;

pub struct NodeNetwork {
    pub peer_id: PeerId,
    pub gossipsub_topic: Topic,
    pub tx: MsgTx,
}

impl NodeNetwork {
    pub async fn new(listen_port: u16, secret_b64: Option<String>) -> Result<Self> {
        // identity keypair (ed25519), derive from base64 if provided for reproducible dev keys
        let id_keys = match secret_b64 {
            Some(s) => {
                let data = base64::engine::general_purpose::STANDARD.decode(s.as_bytes()).context("decoding secret")?;
                identity::Keypair::ed25519_from_bytes(&data).context("construct ed25519 from bytes")?
            }
            None => identity::Keypair::generate_ed25519(),
        };
        let peer_id = PeerId::from(id_keys.public());
        log::info!("Local peer id: {}", peer_id);

        // Transport
        let noise_keys = NoiseConfig::xx(&id_keys).unwrap();
        let transport = TokioTcpConfig::new().nodelay(true);
        let transport = transport
            .upgrade(upgrade::Version::V1)
            .authenticate(noise_keys)
            .multiplex(YamuxConfig::default())
            .boxed();

        // Gossipsub
        let gossipsub_config = GossipsubConfigBuilder::default()
            .heartbeat_interval(Duration::from_secs(10))
            .build()
            .expect("gossip config");
        let mut gossipsub: Gossipsub = Gossipsub::new(MessageAuthenticity::Signed(id_keys.clone()), gossipsub_config)
