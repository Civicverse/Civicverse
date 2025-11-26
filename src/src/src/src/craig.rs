use crate::net::NodeNetwork;
use std::sync::Arc;
use anyhow::Result;
use tokio::sync::Mutex;
use serde::{Serialize, Deserialize};
use ed25519_dalek::PublicKey;
use base64::{engine::general_purpose, Engine as _};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ReceivedAttestation {
    pub issuer: String,
    pub payload: String,
    pub signature_b64: String,
}

pub struct CraigAggregator {
    network: Arc<NodeNetwork>,
    // simple store of attestations
    store: Arc<Mutex<Vec<ReceivedAttestation>>>,
}

impl CraigAggregator {
    pub fn new(network: Arc<NodeNetwork>) -> Self {
        Self { network, store: Arc::new(Mutex::new(Vec::new())) }
    }

    pub async fn start(&self) -> Result<()> {
        // Subscribe to inbound payloads and parse attestations then aggregate periodically
        let mut rx = self.network.subscribe();
        let store = self.store.clone();
        let net = self.network.clone();

        // Spawn a task to consume inbound messages and verify signatures, pushing valid attestations to store
        tokio::spawn(async move {
            while let Ok(payload) = rx.recv().await {
                // Try to parse as JSON attestation
                if let Ok(att) = serde_json::from_slice::<ReceivedAttestation>(&payload) {
                    // Verify signature using issuer pubkey included (dev-only)
                    if let Ok(pub_bytes) = general_purpose::STANDARD.decode(&att.issuer) {
                        if let Ok(pubkey) = PublicKey::from_bytes(&pub_bytes) {
                            let sig_bytes = match general_purpose::STANDARD.decode(&att.signature_b64) {
                                Ok(b) => b,
                                Err(_) => {
                                    log::warn!("invalid signature b64");
                                    continue;
                                }
                            };
                            if sig_bytes.len() != 64 {
                                log::warn!("unexpected signature length");
                                continue;
                            }
                            let mut sig_arr = [0u8; 64];
                            sig_arr.copy_from_slice(&sig_bytes[..64]);
                            let sig = ed25519_dalek::Signature::from_bytes(&sig_arr);
                            match sig {
                                Ok(sig) => {
                                    let verified = pubkey.verify(att.payload.as_bytes(), &sig).is_ok();
                                    if verified {
                                        log::info!("verified attestation from issuer");
                                        let mut s = store.lock().await;
                                        s.push(att);
                                    } else {
                                        log::warn!("attestation signature verification failed");
                                    }
                                }
                                Err(e) => {
                                    log::warn!("bad signature parse: {:?}", e);
                                }
                            }
                        } else {
                            log::warn!("bad issuer pubkey bytes");
                        }
                    } else {
                        log::warn!("issuer pubkey base64 decode failed");
                    }
                } else {
                    log::debug!("received non-attestation payload or failed to deserialize");
                }
            }
        });

        // Periodic aggregator: every 60s, package & publish aggregate if store non-empty
        let store2 = self.store.clone();
        let net2 = net.clone();
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(std::time::Duration::from_secs(60)).await;
                let mut s = store2.lock().await;
                if !s.is_empty() {
                    log::info!("CRAIG aggregator: aggregating {} attestations", s.len());
                    let agg = serde_json::to_vec(&*s).unwrap_or_else(|_| b"[]".to_vec());
                    if let Err(e) = net2.publish("civicverse-craig-aggregates", agg) {
                        log::warn!("publish aggregate err: {:?}", e);
                    }
                    s.clear();
                }
            }
        });

        Ok(())
    }
}
