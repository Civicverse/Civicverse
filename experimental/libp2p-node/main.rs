use anyhow::Result;
use clap::Parser;
use env_logger;
use log::info;
use std::sync::Arc;

mod genesis;
mod net;
mod attestation;
mod craig;

use genesis::Genesis;
use net::NodeNetwork;
use attestation::Attester;
use craig::CraigAggregator;

#[derive(Parser, Debug)]
#[command(author, version, about)]
struct Args {
    /// Path to genesis json
    #[arg(long, default_value = "genesis.json")]
    genesis: String,

    /// Node listen port
    #[arg(long, default_value = "4001")]
    port: u16,

    /// Identity secret key (base64) optional for dev
    #[arg(long)]
    secret: Option<String>,
}

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::init();
    let args = Args::parse();

    info!("Starting Civicverse node");

    // Load genesis
    let genesis = Genesis::load(&args.genesis)?;
    genesis.log_summary();

    // Start network
    let network = NodeNetwork::new(args.port, args.secret.clone()).await?;
    let network = Arc::new(network);

    // Attestation service
    let attester = Attester::from_env_or_random(args.secret.as_deref())?;
    let att = attestation::AttestationService::new(attester, network.clone());
    att.start().await?;

    // CRAIG aggregator — listens for attestations and runs simple threshold
    let craig = CraigAggregator::new(network.clone());
    craig.start().await?;

    info!("Node running — press Ctrl+C to stop");
    tokio::signal::ctrl_c().await?;

    info!("Shutdown requested");
    Ok(())
}
