# Civicverse Development State

## 🚀 Active Environment
The "mother fuckers" are currently running locally (non-Docker) via `npm run start:backend` and `npm run start:frontend`.

- **Frontend:** [http://localhost:3000](http://localhost:3000) (Vite/React)
- **API Server:** [http://localhost:3003](http://localhost:3003) (Identity, Jobs, Governance)
- **Game Server:** [http://localhost:8080](http://localhost:8080) (Multiplayer, UBI, Matches)
- **WebSocket:** `ws://localhost:8080/ws`

## 🛠 Fixes Applied (2026-03-01)
1. **Nginx Routing:** Updated `frontend/nginx.conf` to correctly proxy between port 3003 (Identity) and port 8080 (Game).
2. **API Endpoint Logic:** Fixed `frontend/src/services/api.ts` to use relative `/api` paths, ensuring compatibility with the Nginx proxy in production/Docker.
3. **Build Integrity:** Resolved TypeScript/Vite build failures. All JS files have been migrated to TSX/TS, and artifacts are currently checked into Git to ensure a "running" state.

## 📦 Source Control
- **Remote:** `origin` is `git@github.com:Civicverse/Civicverse-nightly-v0.0.git`
- **Branch:** `main` (Latest commit includes all build and routing fixes).

## 📋 Next Steps
- [ ] Implement actual Shamir's Secret Sharing in `socialRecovery.ts`.
- [ ] Integrate the "real" `@civicverse/civic-id` library when available.
- [ ] Move Rust source files (`main.rs`, `genesis.rs`, etc.) out of the React `frontend/src/` folder into a dedicated crate or backend service.
- [ ] Set up Docker properly (current environment lacks `docker-compose` binary in the shell).

---
*This file is a foundation for future sessions. Adhere to the mandates in the system prompt while referencing this local context.*
