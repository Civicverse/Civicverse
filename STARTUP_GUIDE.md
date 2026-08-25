# 🛠 Civicverse Startup & Contribution Guide

This guide provides a step-by-step walkthrough for setting up the Civicverse development environment, running all microservices, and contributing to the project.

---

## 1. Prerequisites

Before getting started, make sure you have the following installed:
- **Node.js**: v18.x or v20.x ([Download Node.js](https://nodejs.org/))
- **npm**: v9.x or higher
- **Git**: ([Download Git](https://git-scm.com/))
- *(Optional)* **Godot Engine 4.3+**: Required only for 3D scene editing and exports ([Download Godot](https://godotengine.org/))
- *(Optional)* **Docker & Docker Compose**: If running via containers

---

## 2. Initial Setup

### Clone the Repository
```bash
git clone https://github.com/Civicverse/Civicverse.git
cd Civicverse
```

### Install Dependencies & Build
Install all workspace dependencies and compile frontend production assets:
```bash
npm install
npm run build
```

---

## 3. Running the Project

### Option A: Windows One-Click Executable (Windows)
Double-click **`Civicverse.exe`** in the project root (or in `DEV OPS/`), or run `launch.bat`.

- Automatically manages background processes and checks ports `3000`, `3003`, `8080`.
- Launches Backend API, Multiplayer WebSocket, and Frontend web node.
- Automatically opens the web browser to `http://localhost:3000`.

### Option B: Cross-Platform Node CLI
Run from the root directory:
```bash
npm start
```
This concurrently starts:
- Backend API (`http://localhost:3003`)
- Multiplayer Server (`ws://localhost:8080`)
- Frontend Dev Server (`http://localhost:3000`)

### Option C: Component-by-Component Debugging
If you want individual logs in separate terminal windows:
```bash
# Terminal 1: Backend Services
npm run start:backend

# Terminal 2: Frontend Web Client
npm run start:frontend
```

### Option D: Docker Compose
```bash
docker compose up --build
```

---

## 4. Active Ports & Endpoints

| Service | Port / Protocol | Local Endpoint |
| :--- | :--- | :--- |
| **Frontend Web Hub** | `3000` / HTTP | `http://localhost:3000` |
| **Backend API Server** | `3003` / HTTP | `http://localhost:3003` |
| **Multiplayer Server** | `8080` / WS | `ws://localhost:8080/ws` |

---

## 5. Godot 3D Foyer Development

1. Open **Godot Engine 4.3+**.
2. Click **Import** and browse to:
   `packages/civic-foyer/godot-foyer/project.godot`
3. Edit scenes in `scenes/` and GDScript logic in `scripts/`.
4. To export for WebGL / Web integration:
   - Go to **Project -> Export...**
   - Use the **Web** preset targeting:
     `frontend/public/foyer-dist/index.html`

---

## 6. Contribution Workflow

1. **Create a branch**: `git checkout -b feat/your-feature-name`
2. **Develop**: Adhere to TypeScript and modular GDScript guidelines.
3. **Test Build**: Ensure `npm run build` passes with zero errors.
4. **Submit PR**: Open a Pull Request on GitHub against `main`.
