# 📦 Civicverse Modular Protocol Packages

## 🚀 Overview
The `/packages` directory contains the modular protocol logic for the Civicverse ecosystem. Each package is designed to be independent and reusable across the frontend and backend.

---

## 📂 Core Packages

| Package | Purpose |
| :--- | :--- |
| **`@civicverse/civic-foyer`** | The 3D Godot Hub and multiplayer bridge. |
| **`@civicverse/civic-identity`** | Sovereign DID and non-custodial identity protocols. |
| **`@civicverse/civic-vault`** | Encrypted local storage and vault management logic. |
| **`@civicverse/civic-mining`** | Telemetry and coordination for community mining. |
| **`@civicverse/civic-watch`** | Proof-of-Personhood (PoP) verification logic. |
| **`@civicverse/civic-governance`** | DAO and decentralized decision-making protocols. |
| **`@civicverse/civic-marketplace`** | P2P trading and NFT metadata standards. |
| **`@civicverse/civic-protocols`** | Shared types and common protocol definitions. |

---

## 🛠 Working with Packages
This project uses **npm workspaces** for monorepo management.

```bash
# Install all package dependencies from the root
npm install

# Run a specific package script from the root
npm run <script-name> --workspace=<package-name>
```

---

## 🤝 Contribution
When adding new protocol features, always create or update the relevant package. This ensures that logic is shared correctly between the Hub (frontend) and the Relay (backend).
