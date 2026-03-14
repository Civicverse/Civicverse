# ∞ CivicVerse: Non-Custodial Identity & Impact Protocol

CivicVerse is a protocol-level infrastructure for decentralized humanity. It enables sovereign identity, peer-to-peer coordination, and a real-world impact marketplace without intermediaries or centralized extraction.

This is the **Nightly v1.0** build featuring the hardened "Civilian Vault" and the High-Fidelity 3D Avatar Studio.

---

## 🏗 Architectural Overview

- **Monorepo Structure**: Managed via NPM Workspaces.
- **Frontend**: React + TypeScript + Three.js + TailwindCSS (Vite).
- **Backend**: Node.js Express API + WebSocket Multiplayer Server.
- **Identity (The Civilian Vault)**: Local-only, Ed25519-based identity encrypted with PBKDF2 + AES-256-GCM, stored in IndexedDB (Secure Storage).
- **3D Engine**: Procedural humanoid character system built with pure Three.js for cross-platform portability.

---

## 🚀 Startup Guide

### 1. Prerequisites
- **Node.js**: v20.x or higher (LTS recommended).
- **NPM**: v10.x or higher.
- **Git**: For source control management.

### 2. Initial Setup (.git procedure)
To contribute or set up the project locally:

```bash
# Clone the repository (SSH recommended for contributors)
git clone git@github.com:Civicverse/Civicverse-nightly-v0.0.git
# OR via HTTPS
# git clone https://github.com/Civicverse/Civicverse-nightly-v0.0.git

cd Civicverse-nightly-v0.0

# Install all dependencies (Root, Backend, and Frontend)
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (use `.env.example` as a template):
```bash
cp .env.example .env
```
Ensure you update the `ETH_RPC_URL` and other security-sensitive variables.

### 4. Running the Application (Startup procedure)
The system uses `concurrently` to run both the backend and frontend in a single terminal.

```bash
# Start both Backend and Frontend concurrently
npm start
```
- **Frontend Hub**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3003](http://localhost:3003)
- **Multiplayer Server**: `ws://localhost:8080`

For production-ready builds:
```bash
docker-compose -f docker-compose.prod.yml up --build
```

---

## 🛠 For Contributors: Development & Next Build Instructions

We are building the foundation for a sovereign digital society. Here are the immediate technical priorities and instructions for the next build cycle.

### 🏗 Next Build Priorities (Priority Queue)

1.  **Game World Integration (Immediate)**
    - **Bridge the Avatar**: Currently, the 3D Avatar Studio saves a `CharacterConfig` to the vault. We need to bridge this config to `MMORPGPage.tsx` and `FPSGamePage.tsx`.
    - **Refactor MMORPG Scene**: Replace the blocky placeholders in the MMORPG world with the `CharacterViewer` component.

2.  **Security & Recovery**
    - **Social Recovery**: Implement Shamir's Secret Sharing (SSS) in `socialRecovery.ts` to allow users to split their recovery phrase.
    - **WebAuthn**: Integrate Passkeys for hardware-backed session signing.

3.  **Real-World Impact (CivicWatch)**
    - **GPS Verification**: Implement native geolocation checks to verify "Proof-of-Impact" for local civic tasks.
    - **Craig AI Node**: Transition simulated AI verification to a decentralized backend node (Ollama or local LLM inference).

4.  **Economy & Treasury**
    - **Real Blockchain Sync**: Replace mock wallet balances with real-time indexing for Kaspa and Ethereum (Sepolia).
    - **Governance Flow**: Finalize the DAO voting mechanism for treasury transfers.

### 🧪 Contribution Workflow
- **Branching Strategy**: Create feature branches from `main` (e.g., `feat/avatar-bridge`).
- **Committing**: Follow conventional commits (e.g., `feat: add character viewer component`).
- **Testing**: Run `npm test` before submitting pull requests.

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
