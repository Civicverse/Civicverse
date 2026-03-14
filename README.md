# ∞ CivicVerse: Non-Custodial Identity & Impact Protocol

CivicVerse is a protocol-level infrastructure for decentralized humanity. It enables sovereign identity, peer-to-peer coordination, and a real-world impact marketplace without intermediaries or centralized extraction.

This is the **Nightly v1.0** build featuring the hardened "Civilian Vault" and the High-Fidelity 3D Avatar Studio.

---

## 🏗 Architectural Overview

- **Monorepo Structure**: Managed via NPM Workspaces.
- **Frontend**: React + TypeScript + Three.js + TailwindCSS.
- **Backend**: Node.js Express API + WebSocket Multiplayer Server.
- **Identity (The Civilian Vault)**: Local-only, Ed25519-based identity encrypted with PBKDF2 + AES-256-GCM, stored in IndexedDB (Secure Storage).
- **3D Engine**: Procedural humanoid character system built with pure Three.js for cross-platform portability.

---

## 🚀 Startup Guide

### 1. Prerequisites
- **Node.js**: v20.x or higher.
- **NPM**: v10.x or higher.
- **Git**: For source control.

### 2. Initial Setup
```bash
# Clone the repository
git clone git@github.com:Civicverse/Civicverse-nightly-v0.0.git
cd Civicverse-nightly-v0.0

# Install all dependencies (Root, Backend, and Frontend)
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (use `.env.example` as a template):
```bash
cp .env.example .env
```

### 4. Firing up the System
```bash
# Start both Backend and Frontend concurrently
npm start
```
- **Frontend Hub**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3003](http://localhost:3003)
- **Multiplayer Server**: `ws://localhost:8080`

---

## 🛠 For Contributors: What to do next

We are building the foundation for a sovereign digital society. Here are the immediate technical priorities:

### 1. Game World Integration (Priority)
- **Bridge the Avatar**: Currently, the 3D Avatar Studio saves a `CharacterConfig` to the vault. We need to bridge this config to `MMORPGPage.tsx` and `FPSGamePage.tsx` so users appear as their custom characters in game worlds.
- **Refactor MMORPG Scene**: Replace the blocky placeholders in the MMORPG world with the `CharacterViewer` component or a similar Three.js instance.

### 2. Security & Recovery
- **Social Recovery**: Implement Shamir's Secret Sharing (SSS) in `socialRecovery.ts` to allow users to split their recovery phrase among trusted "Guardians."
- **WebAuthn**: Integrate Passkeys/WebAuthn for hardware-backed session signing.

### 3. Real-World Impact (CivicWatch)
- **GPS Verification**: Implement native geolocation checks to verify "Proof-of-Impact" for local civic tasks.
- **Craig AI Node**: Transition the simulated AI verification to a decentralized backend node (Ollama or local LLM inference).

### 4. Economy & Treasury
- **Real Blockchain Sync**: Replace mock wallet balances with real-time indexing for Kaspa and Ethereum.
- **Governance Flow**: Finalize the DAO voting mechanism to trigger actual treasury transfers upon proposal passing.

---

## 📦 Project Structure
- `/frontend`: React application, 3D character engine, and identity vault.
- `/backend`: API server and multiplayer WebSocket gateway.
- `/game`: Game-specific logic and assets.
- `/Ue5_project`: Unreal Engine 5 source and assets.
- `/whitepaper`: Protocol documentation and design specifications.
- `/mining`: Mining simulation and facility logic.
- `/scripts`: Development and automation utilities.
- `GEMINI.md`: Internal development logs and session state.

---

## 📜 Core Mandates
1. **No Extraction**: No hidden fees, no data harvesting.
2. **Non-Custodial**: User always owns the keys.
3. **Sovereign**: The identity belongs to the human, not the platform.

**Build for humanity.**
