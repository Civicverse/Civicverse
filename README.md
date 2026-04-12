# 🌌 Civicverse v1.3: THE FOYER

<p align="center">
  <img src="logo_purple.svg" width="100%" style="display: block; margin: 0 auto;" alt="Civicverse Logo">
</p>

<br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>

<p align="center">
  <b>The Decentralized Metaverse Coordination Layer</b>
</p>

<p align="center">
  <a href="https://github.com/Civicverse/Civicverse-nightly-v0.0/actions/workflows/ci-cd.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/Civicverse/Civicverse-nightly-v0.0/ci-cd.yml?style=for-the-badge&logo=github-actions&label=CI/CD" alt="CI/CD Status">
  </a>
  <img src="https://img.shields.io/github/license/Civicverse/Civicverse-nightly-v0.0?style=for-the-badge&color=orange" alt="License">
  <img src="https://img.shields.io/github/package-json/v/Civicverse/Civicverse-nightly-v0.0?style=for-the-badge&color=blueviolet&label=Civicverse%20V" alt="Version">
</p>

<p align="center">
  <a href="#-getting-started-step-by-step">
    <img src="https://img.shields.io/badge/🚀%20Launch%20Project-007ACC?style=for-the-badge&logo=rocket" alt="Launch">
  </a>
  <a href="#-directory-structure">
    <img src="https://img.shields.io/badge/📖%20Documentation-444444?style=for-the-badge&logo=read-the-docs" alt="Docs">
  </a>
  <a href="./frontend/README.md">
    <img src="https://img.shields.io/badge/🔐%20Access%20Vault-FFD700?style=for-the-badge&logo=lock" alt="Vault">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Privacy-Monero%20Integrated-FF6600?style=flat-square&logo=monero" alt="Monero">
  <img src="https://img.shields.io/badge/Engine-Godot%204.3.1-478CBF?style=flat-square&logo=godot-engine&logoColor=white" alt="Godot">
  <img src="https://img.shields.io/badge/High%20Fidelity-UE5%20Shards-000000?style=flat-square&logo=unreal-engine" alt="UE5">
</p>

---

**The Parallel Digital Nation You Actually Own**

Non-custodial identity • Peer-attested Purple Check soulbound NFTs • Monero P2P economy • Godot + UE5 3D Foyer • Offline-first CivicNodes

---

## ✨ Vision

Civicverse is a fully sovereign, decentralized metaverse coordination layer built for resilience in uncertain times. It is designed as civilian-owned infrastructure that can function even during internet blackouts, financial collapse, or censorship.

Core principles:
- True non-custodial ownership
- Peer-attested identity instead of corporate/government KYC
- Privacy-first economics with Monero
- Offline-first and solar-ready physical nodes
- Community treasury funded by a voluntary 1% civic contribution on flows

---

## 📖 How the System Currently Works (April 2026 — Nightly v1.3)

Civicverse operates as a **hybrid on/off-chain, local-first, fully non-custodial stack**.

### Core Layers

**1. Identity Layer** (`packages/civic-identity` + `civic-vault`)
- All identity data starts fully local and encrypted with PBKDF2 + AES-256.
- Secrets never leave the user's device.
- **Purple Check** soulbound (non-transferable) ERC-721 NFT is minted on an EVM L2 (Base or Arbitrum) only after 3 peer attestations via CivicWatch (Proof-of-Personhood system + local AI validation).
- The Purple Check gates all monetary functions and governance.

**2. Economic Layer** (Smart Contracts + Monero)
- Smart contracts only handle rules, gating, and emit events — they never hold funds.
- Mandatory **1% treasury cut** is enforced on all jobs, tips, donations, gambling, and marketplace transactions.
- When a payment is approved, contracts emit a `MoneroPaymentInstruction` event.
- The user's **Civic Vault** (or local CivicNode) listens for these events and triggers private Monero (XMR) transactions from user-controlled wallets.
- Community mining pool uses XMRig with telemetry feeding the treasury.

**3. The Foyer — Coordination & Metaverse Hub**
- Primary 3D world built in Godot 4.3.1 (HTML5 export available).
- Premium high-fidelity shards in Unreal Engine 5.
- Real-time multiplayer via Socket.io backend.
- CivicWatch jobs, social spaces, skill-based earning, and governance participation all happen here.

**4. Resilience Layer**
- Contracts compiled to WASM for offline execution on CivicNodes.
- Local Merkle-tree queues that sync when back online.
- Raspberry Pi / solar-powered CivicNodes run the full stack locally and can form mesh networks via libp2p experiments.

### Current End-to-End Citizen Flow
1. Open Civic Vault → create locally encrypted identity.
2. Request Purple Check → receive 3 peer attestations + AI review → NFT minted.
3. Enter The Foyer → take CivicWatch jobs or participate in the economy.
4. Job/proof validated → on-chain event emitted.
5. Vault detects event → user (or local relay) broadcasts Monero transaction (99% to recipient, 1% to treasury).
6. Purple Check holders vote on treasury spending via on-chain governance.

**Current Status**: Identity + Vault encryption and basic contracts are semi functional. Foyer multiplayer, full automated Monero relay, UE5 integration, and production CivicNode setups are in active development.

---

## 🚀 Getting Started — From Download to Running

```bash
# 1. Clone the repository
git clone [https://github.com/Civicverse/Civicverse-nightly-v0.0.git](https://github.com/Civicverse/Civicverse-nightly-v0.0.git)
cd Civicverse-nightly-v0.0

# 2. Install all dependencies (monorepo)
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env if needed (RPC URLs, ports, etc.)

# 4. Launch the full stack
chmod +x launch.sh
./launch.sh

---

## 🚦 System Status

| Component | Status | Description |
| :--- | :--- | :--- |
| **Local CivicID** | ✅ **Working** | Local clientside identity creation, encryption, and vault storage. |
| **Community Mining Pool**| 🛠 In Progress | XMRig integration for XMR mining and real-time telemetry. |
| **The Foyer** | 🛠 In Progress | 3D Hub visuals and basic movement; multiplayer relay in development. |
| **CivicWatch (PoP)** | 🛠 In Progress | Peer-to-peer attestation flow and job-based verification. |
| **UE5 Shards** | 🛠 In Progress | High-fidelity world sharding and additive loading. |

---

## 🚀 Getting Started (Step-by-Step)

### 1. Prerequisites
- **Node.js 20+** & **npm 10+**
- **Docker & Docker Compose**
- **Git**

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Civicverse/Civicverse-nightly-v0.0.git
cd Civicverse-nightly-v0.0

# Install dependencies for the entire monorepo
npm install
```

### 3. Configuration
```bash
# Copy the example environment file
cp .env.example .env
# Edit .env to add your local configuration if necessary
```

### 4. Local Startup
You can launch all services using the provided script:
```bash
# Give execution permissions
chmod +x launch.sh

# Start the complete stack
./launch.sh
```
Alternatively, start components manually:
```bash
# Start Backend (API & WebSocket)
npm run start:backend

# Start Frontend (Vite Dev Server)
npm run start:frontend
```

---

## 🤝 Contribution Path

We welcome contributors of all skill levels. Here is how you can align with our development path:

### For Developers
1. **Explore the Monorepo:** Familiarize yourself with the `/packages` structure.
2. **Identity Enhancement:** Help improve the `civic-identity` and `civic-vault` packages.
3. **Godot Mastery:** Contribute to the `civic-foyer` Godot project in `packages/civic-foyer/godot-foyer`.
4. **Security Audits:** Help us refine the `security.yml` workflows and audit local encryption methods.

### For Creators
1. **World Building:** Design new 3D shards for the Foyer.
2. **UI/UX:** Refine the Hub aesthetic in the React frontend.

### Workflow
1. **Fork & Branch:** `git checkout -b feature/your-feature-name`
2. **Develop:** Follow the coding standards (TypeScript, Tailwind CSS).
3. **Verify:** Ensure `npm run build` passes.
4. **PR:** Submit a Pull Request with a clear description of changes.

---

## 📂 Directory Structure

- [**backend/**](./backend/README.md) - Node.js API and Socket.io relay.
- [**frontend/**](./frontend/README.md) - React/Vite dashboard and Vault UI.
- [**packages/**](./packages/README.md) - Modular protocol logic (Identity, Mining, etc.).
- [**contracts/**](./contracts/README.md) - Protocol smart contracts.
- [**Ue5_project/**](./Ue5_project/README.md) - Unreal Engine 5 high-fidelity shards.

---
*Identity is claimed through code.*
