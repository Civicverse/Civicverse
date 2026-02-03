#!/usr/bin/env bash
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
echo "Starting Civicverse demo (backend, miner, frontend, hardhat node)"

# Start backend
cd "$ROOT/backend"
nohup node index.js > ../logs/backend.log 2>&1 &
echo "backend started (logs: logs/backend.log)"

# Start miner simulator
cd "$ROOT/miner"
nohup node miner.js > ../logs/miner.log 2>&1 &
echo "miner started (logs: logs/miner.log)"

# Start hardhat node
cd "$ROOT/smart-contracts"
nohup npx hardhat node > ../logs/hardhat.log 2>&1 &
echo "hardhat node started (logs: logs/hardhat.log)"

# Start frontend
cd "$ROOT/frontend"
nohup npm run dev > ../logs/frontend.log 2>&1 &
echo "frontend started (logs: logs/frontend.log)"

echo "All services started. Tail logs in ./logs to follow."
