# 🛠 Civicverse Startup & Contribution Guide

This guide provides a step-by-step walkthrough for setting up the Civicverse development environment and contributing to the protocol.

## 1. Prerequisites
- **Node.js 18.x or 20.x**
- **npm 9+**
- **Docker & Docker Compose**
- **Godot Engine 4.3.1 (Forward+ Support)**
- **Git**

## 2. Initial Setup

### Clone and Install
```bash
git clone git@github.com:Civicverse/Civicverse-nightly-v0.0.git
cd Civicverse-nightly-v0.0
npm install
```

### Environment Configuration
Copy the example environment file and adjust if necessary:
```bash
cp .env.example .env
```

## 3. Running the Project

### Option A: One-Click (Recommended)
```bash
./launch.sh
```
This starts the backend, frontend, and any required services (like database or redis if applicable via Docker).

### Option B: Manual Workspace Start
```bash
# Start Backend
npm start --workspace=backend

# Start Frontend
npm run dev --workspace=frontend
```

## 4. Godot Foyer Development
1. Open Godot Engine 4.3.1.
2. Import the project located in `/godot-foyer`.
3. To test the web bridge, you may need to export to HTML5:
   `npm run build:foyer`

## 5. Contribution Workflow
We follow a standard Git Flow.

1. **Pick a Task:** Look at the `Next Steps` in the `README.md` or existing issues.
2. **Branch:** `git checkout -b <type>/<short-description>` (e.g., `feat/pop-ui`)
3. **Develop:** Adhere to existing coding standards (Tailwind for CSS, Modular GDScript for Godot).
4. **Test:** Ensure `npm run build` passes for the frontend.
5. **PR:** Push your branch and open a Pull Request against `main`.

## 6. Project Roadmap Highlights
- **PoP Phase 2:** Transitioning from peer codes to cryptographic attestations.
- **Shard System:** Expanding the additive scene loading for larger FOV worlds.
- **CivicFeed:** Enhancing the in-game social layer with real-time video streaming support.

---

For technical support, contact the **Civic Operators** via the Foyer Social Layer.
