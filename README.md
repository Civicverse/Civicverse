# Civicverse

A modular open-source 3D social hub, identity dashboard, and local multiplayer node.

<p align="center">
  <img src="images/CivicverseLogo.png" width="320" alt="Civicverse Logo">
</p>

---

> [!WARNING]
> **Project Status: Early Work-in-Progress (Pre-Alpha)**  
> This project is actively being developed. The core components (frontend dashboard, backend API, WebSocket server, and Godot 3D hub) exist as standalone prototypes, but full end-to-end networked gameplay is not yet connected.

---

Follow these step-by-step instructions to get Civicverse running locally from this repository (`https://github.com/Civicverse/Civicverse`).

### 1. Prerequisites

Ensure the following tools are installed on your machine:
- **Node.js**: v18.x or v20.x ([Download Node.js](https://nodejs.org/))
- **npm**: v9.x or higher (included with Node.js)
- **Git**: ([Download Git](https://git-scm.com/))
- *(Optional)* **Godot Engine 4.3+**: Required only if modifying or exporting the 3D Godot scene ([Download Godot](https://godotengine.org/))
- *(Optional)* **Docker & Docker Compose**: Required only if running containerized services

---

### 2. Clone and Install

Open a terminal (or PowerShell on Windows) and run:

```bash
# Clone this repository
git clone https://github.com/Civicverse/Civicverse.git
cd Civicverse

# Install monorepo dependencies (automatically creates a Civicverse shortcut on your Desktop)
npm install

# Build frontend production assets
npm run build
```

---

### 3. Running the Project

You can choose any of the following launch methods:

#### Method A: Windows One-Click Executable (Recommended on Windows)
Simply double-click the **`Civicverse`** shortcut on your Desktop (or `Civicverse.exe` in the repo root / `launch.bat`).

- Automatically detects and verifies the Node.js runtime.
- Automatically places a shortcut on your Desktop if not already present.
- Automatically clears any stale port conflicts on ports `3000`, `3003`, and `8080`.
- Launches the Backend API, Multiplayer Server, and Frontend simultaneously.
- Opens your default web browser to `http://localhost:3000`.
- Includes a live log console and system tray minimization.

*(To recompile the executable from source on Windows: `npm run build:exe`)*

---

#### Method B: Monorepo All-in-One CLI (Cross-Platform)
From the root repository directory:

```bash
npm start
```
This uses `concurrently` to start both the backend services and the Vite frontend dev server.

---

#### Method C: Manual Service-by-Service Startup
If you want to run each service in its own terminal window for debugging:

**Terminal 1 — Backend Services (API on 3003 & Multiplayer on 8080):**
```bash
npm run start:backend
```

**Terminal 2 — Frontend Web Node (Port 3000):**
```bash
npm run start:frontend
```

---

#### Method D: Docker Compose
To run containerized services:

```bash
docker compose up --build
```

To stop:
```bash
docker compose down
```

---

### 4. Active Endpoints & Ports

When all services are running, the following endpoints are available:

| Service | Protocol / Port | URL | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Web Hub** | HTTP / `3000` | `http://localhost:3000` | Main user interface, character creator, and dashboard |
| **Backend API Server** | HTTP / `3003` | `http://localhost:3003` | REST API for identity, wallet backup, and tasks |
| **Multiplayer Server** | WS / `8080` | `ws://localhost:8080/ws` | Real-time WebSocket relay for player state & chat |

---

## 🛠 Godot 3D Foyer Development

To work directly on the 3D Foyer in Godot:

1. Open **Godot Engine 4.3+**.
2. Click **Import** and navigate to:
   ```
   packages/civic-foyer/godot-foyer/project.godot
   ```
3. Open the project.
4. Main world scene is located at `scenes/Main.tscn` or `scenes/World.tscn`.
5. To test web export builds:
   - Ensure the Web export template is installed in Godot.
   - Export destination: `frontend/public/foyer-dist/index.html`.

---

## 📁 Repository Structure

```
Civicverse/
├── Civicverse.exe             # Windows standalone launcher executable
├── CivicverseLauncher.cs      # C# source code for Windows launcher
├── launch.bat                 # Windows batch launcher script
├── launch.sh                  # Linux/macOS bash launcher script
├── package.json               # Root monorepo configuration & scripts
├── docker-compose.yml         # Container configuration
│
├── backend/                   # Express API & WebSocket services
│   ├── index.js               # REST API server (Port 3003)
│   ├── multiplayer-server.js  # WebSocket server (Port 8080)
│   ├── start.js               # Concurrent backend process runner
│   └── package.json
│
├── frontend/                  # React 18 + Vite Web Application
│   ├── src/                   # React components, pages, state store
│   ├── public/                # Static assets & Godot HTML5 export target
│   ├── vite.config.ts         # Vite bundler & API proxy configuration
│   └── package.json
│
├── packages/                  # Modular workspaces
│   ├── civic-foyer/           # Godot 3D game client
│   │   └── godot-foyer/       # Godot project files (scenes, scripts, assets)
│   ├── civic-identity/        # Identity encryption and key management
│   ├── civic-vault/           # Client wallet and credential storage
│   ├── civic-watch/           # Task and verification logic
│   ├── civic-governance/      # Proposal and voting logic
│   ├── civic-mining/          # Mining telemetry integration
│   └── civic-marketplace/     # Item listing and inventory logic
│
└── scripts/                   # Build and utility scripts
    ├── build_exe.ps1          # PowerShell C# compilation script
    └── dev.sh                 # Local development helper script
```

---

## 🤝 Contributing

Contributions are welcome! 

NOTE: Please do not donate crypto instead point your miner, server, spare pc or gaming rig directly to the Civicverse Monero Gui Wallet and contribute hash as it supports the Monero network and provides proof of concept for the project which is more powerful and meaningful than a few dollar crypto donation.

Name your miner and watch it start hashing away in real time in the miner tab then share it to your social media pages and brag to the people who you will never meet in real life about how your joining forces with the community around you to takeover capitalism for the people legally and there isnt a bitch ass thing anyone can do about it.

To contribute:

1. Fork or branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your modifications.
3. Verify that the build succeeds:
   ```bash
   npm run build
   ```
4. Commit your changes and open a Pull Request with a clear summary of what was added or fixed.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE.txt](./LICENSE.txt) file for details.
