# Civicverse Demo — Quick Start

This repository contains a runnable demo of the Civicverse project: a playable 16-bit Mode7-style city, marketplace, mining dashboard, simple quests and citizen onboarding, and demo smart contracts.

This demo is intentionally self-contained. It uses in-memory stores and a local Hardhat node for smart-contract work. Swap the placeholder addresses and RPC URLs with production values when ready.

Requirements
- Node.js >= 18
- npm
- (Optional) Docker & Docker Compose

Start components (separate terminals recommended)

1) Backend API

```bash
cd /home/civicverseuser/Civicverse/backend
npm install
node index.js
```

Runs: http://localhost:8081

2) Miner simulator (demo)

```bash
cd /home/civicverseuser/Civicverse/miner
npm install
node miner.js
```

Runs: http://localhost:9090 (control endpoints)

3) Frontend (Vite)

```bash
cd /home/civicverseuser/Civicverse/frontend
npm install
npm run dev
```

Open: http://localhost:5173

Optional: Start everything with Docker Compose

```bash
cd /home/civicverseuser/Civicverse
docker compose -f docker-compose.demo.yml up --build
```

Notes
- Marketplace purchases call `/api/purchase` which credits a 1% tax to the demo treasury (`/api/treasury`). Replace this with real on-chain payments in production.
- The backend can optionally connect to an RPC node: set `RPC_URL` environment variable to an Ethereum-compatible JSON RPC endpoint; the demo will attempt to read on-chain multisig balance for display.
- Miner UI supports Kaspa/Monero as a UI toggle. Integrating real miners requires running actual miner daemons and wiring their control APIs to the demo miner control endpoints.
Visual upgrades in the demo:
 - Visuals: The frontend includes a Mode7-like demo scene, neon signs and moving cars to evoke a vibrant 16-bit cyberpunk city.
 - Audio: The demo includes a synthwave background track and purchase sound effects. Use the Play Music button in the UI to enable audio playback (browser autoplay rules may require a user gesture).

Final demo wrap-up:

- The demo is now a self-contained local prototype with:
  - Visual Mode7-style city with animated cars and neon signs.
  - Character creation, citizen onboarding and persistent storage (SQLite at `backend/data.db`).
  - Marketplace with create/list/buy flows; purchases credit a 1% tax to the treasury and 0.1% to the UBI pool.
  - Mining dashboard with demo miner registration and a placeholder for Kaspa/Monero miners.
  - UBI pool and distribution; citizens receive equal UBI shares which are persisted.
  - Synthwave background music and SFX for purchases/claims.

Run the full demo locally (quick):

```bash
# start backend (creates data.db)
cd /home/civicverseuser/Civicverse/backend && npm install && node index.js
# start miner simulator
cd /home/civicverseuser/Civicverse/miner && npm install && node miner.js
# start frontend
cd /home/civicverseuser/Civicverse/frontend && npm install && npm run dev
```

Open `http://localhost:5173` and use the UI. When you're ready to wire on-chain transfers, set these env vars when starting the backend:

```bash
export ENABLE_ONCHAIN=true
export PRIVATE_KEY="0x..."  # use only test/private keys for local testing
export RPC_URL="http://localhost:8545"  # or your RPC endpoint
node index.js
```

If you want a single-command demo start (non-production), use the `scripts/start-dev.sh` script which runs components in background and writes runtime logs to `logs/`.


- UBI: A small portion of purchases (0.1% in demo) is credited to the UBI pool. Use the UBI Dashboard to view and distribute the pool equally among registered citizens.
- To start all services unattended you can use `scripts/start-dev.sh` (it writes logs to `logs/`).

Files of interest
- `frontend/` — React + Phaser game UI and pages (Marketplace, Mining Dashboard, Quests, Schoolhouse, Fighter, Pong)
- `backend/` — Express API with market, miner, treasury, quests, and citizen endpoints
- `smart-contracts/` — Hardhat demo contracts (`QuadraticVoting.sol`, `MultiSigTaxWallet.sol`) and `scripts/deploy.js`
- `miner/` — miner simulator with a control endpoint (demo)
- `docker-compose.demo.yml` — orchestration for demo with containers

Next steps to productionize
- Integrate real miners (Kaspa/Monero) with containerized daemons and secure wallet configs
- Replace demo treasury in-memory storage with on-chain multisig transactions and event listeners
- Implement persistent database for users, marketplace listings, and quests
- Add authentication, MetaMask integration, and secure payment flows
- Add more game assets, character creation, and immersive world features

If you'd like, I can continue by:
- A) Adding containerized example configs for Kaspa/Monero miners (non-production) and wiring to miner control; or
- B) Upgrading the backend to read/write to the deployed `MultiSigTaxWallet` on a local Hardhat node using `ethers`; or
- C) Building out the character creation flow and more game assets and animations.

Pick A, B or C and I'll proceed.
# Civicverse Demo — Quick Start

This demo provides a local, fully self-contained prototype of the Civicverse concept:

- Frontend: Vite + React + Phaser demo with Mode7-like city, 2-player fighter, Pong, marketplace, news, schoolhouse.
- Backend: Express API providing market, news and miner control endpoints.
- Smart contracts: Hardhat project with simple Quadratic Voting + MultiSig wallet contracts (deployable to local Hardhat node).
- Miner: Node.js miner simulator with control endpoint and default 1 CPU busy-sim.
- Docker Compose: `docker-compose.demo.yml` to run everything together.

Requirements: Docker & Docker Compose, or Node.js/npm to run components individually.

Run with Docker Compose (recommended):
```bash
docker compose -f docker-compose.demo.yml up --build
```

Then open the frontend at http://localhost:5173

Run components individually:
- Frontend:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- Backend:
  ```bash
  cd backend
  npm install
  npm start
  ```
- Hardhat (local node):
  ```bash
  cd smart-contracts
  npm install
  npx hardhat node
  ```
  In another terminal you can deploy the demo contracts:
  ```bash
  npx hardhat run scripts/deploy.js --network localhost
  ```
- Miner simulator:
  ```bash
  cd miner
  npm install
  node miner.js
  ```

Notes:
- All keys are placeholders; the demo uses a local Hardhat node and simplified contracts for demonstration. Replace addresses and use a secure multisig for production.
- The marketplace and microtransaction tax routing are mocked in the backend; integrate with real payments or blockchain flows for production.
