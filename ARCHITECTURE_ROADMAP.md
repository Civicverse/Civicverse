# 🗺️ Civicverse Master Architecture & Execution Plan

This document serves as the permanent, locked-in architectural blueprint and phased execution roadmap for the Civicverse project.

---

## 🏛️ System Architecture Overview

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │               CIVICVERSE NODE PLATFORM                 │
                                  └──────────────────────────┬─────────────────────────────┘
                                                             │
                    ┌────────────────────────────────────────┼────────────────────────────────────────┐
                    │                                        │                                        │
┌───────────────────▼──────────────────┐ ┌───────────────────▼──────────────────┐ ┌───────────────────▼──────────────────┐
│          FRONTEND CLIENT             │ │          BACKEND SERVICES            │ │       IMMUTABLE DATA & IDENTITY       │
│ • React 18 + Tailwind UI Hub         │ │ • Express REST API (Port 3003)       │ │ • SQLite Embedded DB (Zero-config)    │
│ • Godot 4.3 WebGL Engine Viewport    │ │ • WebSocket Relay Server (Port 8080) │ │ • EVM Soulbound NFT (ERC-5192/721)    │
│ • JavaScriptBridge React ↔ Engine    │ │ • Optional XMR Node Monitor Daemon   │ │ • EIP-712 Cryptographic Signatures    │
└──────────────────────────────────────┘ └──────────────────────────────────────┘ └──────────────────────────────────────┘
```

---

## 📋 Phased Execution Roadmap

### 🧱 Phase 1: Backend Database & Persistent Core
**Objective**: Eliminate mock JSON files and volatile in-memory state; replace with an embedded, resilient SQLite database.

1. **Embedded SQLite Database (`data/civicverse.db`)**:
   - **`users`**: `did`, `eth_address`, `username`, `public_key`, `trust_score`, `level`, `avatar_config_json`, `created_at`.
   - **`wallets`**: `did`, `encrypted_backup_blob`, `balance`, `pending_balance`, `currency`, `updated_at`.
   - **`missions`**: `id`, `title`, `description`, `category`, `reward`, `difficulty`, `status`, `creator_did`, `assignee_did`, `proof_text`, `proof_image`.
   - **`chat_messages`**: `id`, `shard_id`, `sender_did`, `username`, `message_text`, `badge_level`, `created_at`.
   - **`governance`**: `id`, `title`, `description`, `proposer_did`, `votes_for`, `votes_against`, `status`, `expires_at`.
   - **`mining_telemetry`**: `timestamp`, `hashrate`, `active_threads`, `shares_accepted`, `treasury_balance`.
2. **REST API Overhaul (`backend/index.js`)**:
   - Refactor all `/api/*` endpoints to query and mutate SQLite directly with parameter binding and schema migrations.
3. **Optional Manual XMR Node & Spectator Monitor**:
   - Isolate XMRig integration into a clean, strictly manual toggle.
   - Dedicated dashboard telemetry endpoint (`/api/miner/status`) for node operators who choose to run it and monitor treasury flow.

---

### 🛡️ Phase 2: Ethereum Soulbound Identity (EVM Standard)
**Objective**: Build a clean, standard, issue-free Soulbound Identity system on Ethereum / EVM L2.

1. **Soulbound Token Smart Contract (`contracts/CivicIdentitySBT.sol`)**:
   - Implements **ERC-5192** (Minimal Soulbound NFT interface) on top of ERC-721.
   - Non-transferable token permanently bound to the user's Ethereum address.
   - Multi-attestation verification: Mints / upgrades metadata badge (Purple Check) upon receiving 3 valid peer attestations.
2. **EIP-712 Cryptographic Request Verification**:
   - Users sign API requests (voting, accepting missions, chat) with their private key.
   - Backend verifies signature authenticity before committing actions to the database.

---

### 🎮 Phase 3: Godot 4.3 Foyer Client (Potato-PC Accessible & WebGL)
**Objective**: Replicate the exact visual aesthetic, shaders, and controls of the Three.js prototype inside Godot 4.3, optimized for low-spec PCs and browser embedding.

1. **Godot 4.3 WebGL Export Pipeline**:
   - Automated export target: `frontend/public/foyer-dist/index.html`.
   - HTML5 canvas embedded seamlessly inside the React `FoyerPage.tsx`.
2. **Visuals & Environment (GDScript + Shaders)**:
   - Port cyberpunk neon shaders, wet asphalt reflections, volumetric atmosphere, and camera bloom to Godot Forward+ / Compatibility renderer.
3. **Character Controller & Movement**:
   - Third-person and first-person toggle.
   - Smooth movement (WASD), sprinting, jumping, camera orbit, and raycast collision against urban city blocks.
4. **Two-Way JavaScriptBridge**:
   - `React ➔ Godot`: Inject local user avatar colors, DID, username, and trust tier into the 3D player.
   - `Godot ➔ React`: Trigger UI overlay tabs (Vault, Mission Board, Governance, Market) when the player interacts with in-world kiosks.
5. **WebSocket Multiplayer Synchronization**:
   - Native Godot WebSocket client connecting to `ws://localhost:8080/ws`.
   - Tick-based position/rotation sync (20-30Hz) and linear interpolation for smooth remote player movement.

---

### 🌐 Phase 4: Real Local Mesh & Offline P2P Protocol
**Objective**: Write working peer-to-peer networking code for local discovery and offline synchronization between nodes.

1. **Local Node Discovery**:
   - mDNS (multicast DNS) and UDP broadcast for instant LAN peer discovery without internet.
   - WebRTC data channels for browser-to-browser direct connections.
2. **Local Gossip & Offline Sync Queue**:
   - Store pending tasks, attestations, and chat in a local append-only log / Merkle queue.
   - Synchronize logs peer-to-peer over LAN when offline, and reconcile with the global backend when an uplink is detected.

---

### 🚀 Phase 5: High-Fidelity Unreal Engine 5 Flagship Shard
**Objective**: Once the Godot version is fully fun, rock-solid, and optimized, build the high-end Unreal Engine 5 visual experience.

1. **UE5 Client Architecture**:
   - Plug UE5 directly into the same Node.js WebSocket backend (Port 8080) and SQLite / EVM Identity layer.
   - High-fidelity Nanite geometry, Lumen real-time global illumination, and high-polygon character rigs.
   - Inter-engine shard travel: Seamlessly switch between Godot (Web/Potato PC) and UE5 (High-End Gaming Rig) using the same Civic Identity.

---

## 🔒 Locked Tech Stack Matrix

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, Vite, Tailwind CSS, Zustand | Fast cyberpunk web interface & dashboard |
| **Lightweight 3D Engine** | Godot 4.3 (WebGL & Desktop) | Accessible, optimized 3D world for potato PCs |
| **Flagship 3D Engine** | Unreal Engine 5 | High-fidelity next-gen graphical shard |
| **Backend API** | Node.js, Express | Modular REST microservices |
| **Multiplayer Relay** | Node.js WebSocket (`ws`) | Real-time tick sync & spatial chat |
| **Database** | SQLite (`better-sqlite3`) | Fast, zero-config relational storage |
| **Identity Standard** | Ethereum Soulbound (ERC-5192 / ERC-721) | Non-transferable cryptographic credentials |
| **P2P Mesh Network** | WebRTC + mDNS Gossip | Offline-first node coordination |
| **Desktop Launcher** | C# Native Windows Executable (.NET) | One-click background orchestrator |
