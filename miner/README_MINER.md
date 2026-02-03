Kaspa/Monero Miner Integration (Demo placeholders)

This folder contains a simple miner simulator (`miner.js`) used by the demo. Real miners (Kaspa, Monero) are native binaries and require configuration, wallets, and resource controls. For safety and size reasons this demo provides:

- `miner.js`: a lightweight CPU-burning simulator with a control API at `http://localhost:9090`.
- `README_MINER.md`: this file describing how to replace the simulator with real miners.

To integrate real miners in production:
1. Prepare miner binaries or Docker images for the miner you want (Kaspa or Monero).
2. Expose or wrap their control API (some miners have RPC or telnet controllers) and implement an adapter that speaks the same HTTP endpoints as the demo (`/status`, `/set`).
3. Configure wallet addresses (never store mainnet private keys in repo). Use environment variables to provide addresses to the adapter.
4. Ensure the miner process runs with resource limits (docker `--cpus`, systemd slice, or cgroups).

If you want, I can add sample docker-compose service entries that run a placeholder container and show where to mount real miner binaries.
