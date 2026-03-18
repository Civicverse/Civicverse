# ∞ CivicVerse: Non-Custodial Identity & Impact Protocol

CivicVerse is a protocol-level infrastructure for decentralized humanity. It enables sovereign identity, peer-to-peer coordination, and a real-world impact marketplace without intermediaries or centralized extraction.

This is the **v1.2-NIGHTLY** build featuring the in progress **CivicWatch Load Board**, **Quadratic Governance**, and the **Community Hub**.

---

## 🏗 Architectural Overview

- **Monorepo Structure**: Managed via NPM Workspaces.
- **Frontend**: React + TypeScript + Three.js + TailwindCSS (Vite).
- **Backend**: Node.js Express API + WebSocket Multiplayer Server.
- **Hub Page**: `FoyerPage.tsx` acts as the unified coordination layer for identity, missions, and governance.
- **Identity (The Civilian Vault)**: Local-only, Ed25519-based identity encrypted with PBKDF2 + AES-256-GCM, stored in IndexedDB (Secure Storage).
- **Governance**: Quadratic Voting Protocol (`Cost = Weight²`) with AI Watchdog auditing and Community Treasury management.

---

## 🚀 Startup Guide

### 1. Prerequisites
- **Node.js**: v20.x or higher (LTS recommended).
- **NPM**: v10.x or higher.
- **Docker**: Optional, required for production-ready stack.

### 2. Initial Setup (.git procedure)
To set up the development environment from scratch:

```bash
# 1. Clone the repository
git clone https://github.com/Civicverse/Civicverse-nightly-v0.0.git
cd Civicverse-nightly-v0.0

# 2. Install dependencies for the entire monorepo
# This installs root, frontend, and backend dependencies in one go.
npm install

# 3. Configure environment variables
# Copy the example environment file and adjust if necessary
cp .env.example .env
```

### 3. Spinning it Up (Development)
The nightly build uses `concurrently` to launch the full stack (Frontend, API, and Multiplayer Server) in a single command.

```bash
# Start the full development stack
npm start
```
- **Community Hub**: [http://localhost:3000](http://localhost:3000)
- **API Terminal**: [http://localhost:3003](http://localhost:3003)
- **Multiplayer Relay**: `ws://localhost:8080`

### 4. Production Deployment (VPS)
The stack is pre-configured for seamless VPS deployment via Docker Compose.

```bash
# Launch the production-ready stack
docker-compose -f docker-compose.prod.yml up --build -d
```

---

## 🛠 For Contributors: Next Build Instructions

We are transitioning from protocol design to operational infrastructure. Here are the priorities for the next build cycle.

### 🏗 Priority Queue (Next Steps)

1.  **Decentralized Storage Integration**
    *   **IPFS for Proofs**: Transition mission verification images and instructional video metadata from local storage to IPFS.
    *   **Sovereign Backup**: Implement encrypted identity backups to community-governed nodes as per the whitepaper.

2.  **Marketplace & Economy**
    *   **P2P Marketplace**: Synchronize the marketplace module with the global ledger to enable direct peer-to-peer commerce.
    *   **UBI Engine Execution**: Connect the Community Treasury to the UBI engine for automated disbursements based on passed governance votes.

3.  **Field Optimization (PWA)**
    *   **Mobile Readiness**: Optimize the CivicWatch interface for field use with offline-first PWA capabilities and native GPS locking.

### 🧪 Contribution Workflow
- **Branching**: Create feature branches from `main` (e.g., `feat/ipfs-integration`).
- **Standard**: Follow conventional commits and ensure `npm run build` passes before submission.

---

## 💎 Support the Vision

A huge **thank you** to the citizens supporting the **Community Wallet**. Every bit of hashpower contributed helps us build the infrastructure for decentralized humanity and secures the Community Treasury. Your support directly funds the missions deployed on the CivicWatch board.

---

## 📜 Core Mandates
1. **No Extraction**: No hidden fees, no data harvesting.
2. **Non-Custodial**: User always owns the keys.
3. **Sovereign**: Your identity belongs to you, not the platform.

**Build for humanity.**
