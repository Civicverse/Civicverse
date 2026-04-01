# 🌌 Civicverse v1.3-ULTRA: SOVEREIGN NEON

Welcome to **Civicverse**, the decentralized metaverse coordination layer. This repository contains the complete infrastructure for a sovereign digital humanity, including a web-based identity vault and the **NEON REIGN** Godot-powered Foyer.

## 🚀 Quick Start (One-Click Launch)

Ensure you have **Docker** and **Node.js 18+** installed.

```bash
# Clone the repository
git clone git@github.com:Civicverse/Civicverse-nightly-v0.0.git
cd Civicverse-nightly-v0.0

# Launch all services (Frontend, Backend, Godot Foyer Bridge)
./launch.sh
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Civic Vault:** Access your sovereign identity and PoP status.
- **NEON REIGN Foyer:** Centrally integrated into the Hub.

---

## 🧬 Core Infrastructure

### 1. Sovereign Identity (Civic Vault)
- **Non-Custodial:** Your keys, your identity. Encrypted locally with PBKDF2/AES-256.
- **Proof-of-Personhood (PoP):** 3-person physical peer verification flow.
  - **Green X (1/3 & 2/3):** Initial attestations.
  - **Purple Check (3/3):** Fully verified CivicID. Unlocks monetary features.
- **Identity Export:** Encrypted JSON backups and QR-based DID sharing.

### 2. NEON REIGN - The Foyer (Godot 4.3.1)
The central 3D hub for Civicverse.
- **Visuals:** Hyper-realistic cell-shaded world with bold ink outlines and neon emissives.
- **Portal Shards:** Seamless additive loading into owner-created worlds (Store, School, Social, BR).
- **Battle Royale:** Integrated 16-32 player shooter mechanics within the Foyer city.
- **CivicFeed:** Real-time social layer (X-style) with integrated reputation and VOIP.

### 3. P2P Monetary Protocols
- **Monero Integration:** Native XMR support for privacy-preserving transactions.
- **P2P Gambling:** Bet CVT tokens on Foyer matches with a 1% microtax funding the UBI pool.
- **Community Mining:** SupportXMR integrated mining dashboard.

---

## 🛠 Developer & Contributor Guide

### Repository Structure
- `/frontend`: React + Vite + Tailwind (The Hub UI).
- `/backend`: Node.js + Express + Socket.io (Multiplayer & State Relay).
- `/godot-foyer`: Godot 4.3.1 Forward+ source project.
- `/contracts`: Solidity interfaces for future L2 anchoring.

### Next Steps for Contributors
1. **PoP Jobs:** Implement the CivicWatch job-based verification path.
2. **Shard Expansion:** Create new `.tscn` shards in `godot-foyer/scenes/shards/`.
3. **PWA Transition:** Add service worker for offline-first vault access.
4. **IPFS Storage:** Hook avatar metadata to decentralized storage.

### Git Workflow
1. Create a feature branch: `git checkout -b feature/neon-upgrade`.
2. Commit changes using atomic, descriptive messages.
3. Push and open a Pull Request.

---

## 📜 Vision
**Civicverse** is built for a future where identity is not granted by governments, but recognized by peers. We are building the infrastructure for a decentralized, sovereign humanity.

**Sovereignty Awaits.**
