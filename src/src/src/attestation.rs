use anyhow::{Result, Context};
use ed25519_dalek::{Keypair, Signature, Signer};
use rand::rngs::OsRng;
use base64::{engine::general_purpose, Engine as _};
use crate::net::NodeNetwork;
use std::sync::Arc;
use serde::{Serialize, Deserialize};
use chrono::Utc;

#[derive(Clone)]
pub struct Attester {
    pub keypair: Keypair,
    pub pubkey_b64: String,
}

impl Attester {
    /// Generate a new random keypair
    pub fn generate() -> Result<Self> {
        let mut csprng = OsRng{};
        let kp = Keypair::generate(&mut csprng);
        let pub_b64 = general_purpose::STANDARD.encode(kp.public.to_bytes());
        Ok(Self { keypair: kp, pubkey_b64: pub_b64 })
    }

    /// Construct from a base64-encoded 64-byte keypair (private+public)
    pub fn from_secret_b64(secret_b64: &str) -> Result<Self> {
        let bytes = general_purpose::STANDARD.decode(secret_b64).context("decode secret b64")?;
        let kp = Keypair::from_bytes(&bytes).context("from bytes")?;
        let pub_b64 = general_purpose::STANDARD.encode(kp.public.to_bytes());
        Ok(Self { keypair: kp, pubkey_b64: pub_b64 })
    }

    /// Helper: pick from provided opt secret or generate new
    pub fn from_env_or_random(opt_secret: Option<&str>) -> Result<Attester> {
        match opt_secret {
            Some(s) => Attester::from_secret_b64(s),
            None => Attester::generate(),
        }
    }

    /// Sign payload bytes
    pub fn sign(&self, payload: &[u8]) -> Signature {
        self.keypair.sign(payload)
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Attestation {
    pub issuer: String,
    pub payload: String,
    pub signature_b64: String,
}

pub struct AttestationService {
    attester: Attester,
    network: Arc<NodeNetwork>,
}

impl AttestationService {
    pub fn new(att: Attester, network: Arc<NodeNetwork>) -> Self {
        Self { attester: att, network }
    }

    pub async fn start(&self) -> Result<()> {
        // publish heartbeat attestations periodically
        let net = self.network.clone();
        let att = self.attester.clone();
        tokio::spawn(async move {
            loop {
                let payload = format!("heartbeat:{}", Utc::now().timestamp());
                let sig = att.sign(payload.as_bytes());
                let sig_b64 = general_purpose::STANDARD.encode(sig.to_bytes());
                let att_obj = Attestation { issuer: att.pubkey_b64.clone(), payload: payload.clone(), signature_b64: sig_b64 };
                let data = serde_json::to_vec(&att_obj).unwrap_or_else(|_| b"{}".to_vec());
                if let Err(e) = net.publish("civicverse-attestations", data) {
                    log::warn!("failed publish attestation: {:?}", e);
                }
                tokio::time::sleep(std::time::Duration::from_secs(30)).await;
            }
        });

        // Also listen to inbound messages (optional: for demo we log)
        let mut rx = self.network.subscribe();
        tokio::spawn(async move {
            while let Ok(payload) = rx.recv().await {
                if let Ok(s) = std::str::from_utf8(&payload) {
                    log::debug!("AttestationService received inbound payload: {}", s);
                } else {
                    log::debug!("AttestationService received inbound payload (non-utf8)");
                }
            }
        });

        Ok(())
    }
}
