# ∞ CivicVerse: Non-Custodial Identity & Impact Protocol

CivicVerse is a protocol-level infrastructure for decentralized humanity. It enables sovereign identity, peer-to-peer coordination, and a real-world impact marketplace without intermediaries or centralized extraction.

---

## 🚀 Quick Start Guide (MVP)

### 1. Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **NPM**: v9+
- **Ports**: Ensure `3000`, `3003`, and `8080` are free.

### 2. Installation
From the root directory:
```bash
# Install all dependencies for root, backend, and frontend
npm install
```

### 3. Firing it up
```bash
# Start both backend services and the frontend hub concurrently
npm start
```
- **Frontend Hub**: `http://localhost:3000`
- **Backend API**: `http://localhost:3003`
- **Multiplayer WS**: `ws://localhost:8080`

---

## 🛠 Technical Architecture

### 1. Zero-Custody Identity (`/frontend/src/lib/civicIdentity.ts`)
Uses **Ed25519** and **PBKDF2** for local-only identity generation.
- **Sovereignty**: Your DID (Decentralized ID) is derived from local entropy and encrypted with your password. 
- **Privacy**: No central database of users exists. Authentication is a cryptographic signature challenge.

### 2. Multi-Chain Asset Vault (`/frontend/src/lib/civicWallet.ts`)
A BIP-32/BIP-39 hierarchical deterministic wallet.
- **Interoperability**: One seed phrase derives addresses for **BTC, ETH, KASPA,** and **MONERO**.
- **Security**: Private keys never leave the device. Transactions are signed locally.

### 3. CivicWatch: Impact Dispatch (`/frontend/src/pages/CivicWatchPage.tsx`)
A real-world "Indeed-style" marketplace for civic work.
- **Dispatch**: Accept local missions (Cleanup, Audits, Social Aid).
- **Verification**: Proof-of-Impact analyzed by **Craig AI** (Simulation) and verified on-chain.
- **Redistribution**: Payments trigger a **1% Micro-Tax** for community UBI.

### 4. Governance DAO (`/frontend/src/pages/GovernancePage.tsx`)
Decentralized protocol control.
- **Voting**: Signed, weight-based voting on treasury allocations and parameter changes.
- **Execution**: Passed proposals trigger automated treasury transfers or multiplier adjustments.

---

## 🛰 Roadmap: Getting to "Real"

To move from the current functional prototype to a global production system, contributors should focus on:

### Phase 1: Hardening & Security (Current Priority)
1. **Real BIP-44 Libraries**: Replace internal BIP-32/39 mocks with audited libraries (like `@scure/bip39`).
2. **Key Storage**: Move from `localStorage` to **IndexedDB** or **Secure Enclave** (WebAuthn/Passkeys) for hardware-level security.
3. **Transaction Signing**: Implement actual transaction construction for Kaspa and Ethereum using `ethers.js` or `kaspa-wasm`.

### Phase 2: Real-World Verification
1. **GPS Proofs**: Integrate native geolocation verification to ensure workers are actually "on-location".
2. **Mobile Dispatch**: Build a Capacitor/React Native wrapper to enable mobile-first fieldwork (Camera access, GPS).
3. **AI Node**: Transition "Craig AI" from a frontend simulation to a decentralized backend service (e.g., using Ollama or a dedicated AI inference node).

### Phase 3: Infrastructure
1. **P2P Syncing**: Implement **GunDB** or **OrbitDB** for serverless data syncing between users.
2. **LoRaWAN Support**: Add support for offline mesh network communication for disaster-recovery scenarios.

---

## 👥 Contributing

We are building for humanity. All contributions must respect the **Core Mandates**:
1. **No Extraction**: No hidden fees, no data harvesting.
2. **Non-Custodial**: User always owns the keys.
3. **Open Source**: The protocol is public good.

**Pick up where we left off:** Check `.gemini/PROGRESS.md` for the current dev queue.
