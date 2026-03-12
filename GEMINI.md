# Civicverse Development State

## 🚀 Active Environment
The services are running locally via `npm run start` or via the new production stack:
- **Production Stack:** `docker-compose -f docker-compose.prod.yml up --build`
- **Frontend Gateway:** [https://localhost](https://localhost) (Nginx Reverse Proxy)
- **API Server:** [https://localhost/api/status](https://localhost/api/status)

## 🛠 Security & Infrastructure Overhaul (2026-03-12)

### 1. Hardened Key Storage (The "Civilian Vault")
- **IndexedDB Transition:** Replaced insecure `localStorage` for private keys and DID data with a new `secureStorage.ts` module using `IndexedDB`.
- **Async Identity Flow:** Refactored `CivicIdentity.ts` to use asynchronous secure storage, preventing XSS-based key scraping.
- **Encryption at Rest:** All sensitive data is now stored as encrypted blobs, requiring the user's password to derive the decryption key via PBKDF2.

### 2. Production-Grade Containerization
- **Non-Root Execution:** Backend now runs as `USER node` in `Dockerfile.prod` to prevent container-to-host breakout.
- **Multi-Stage Builds:** Reduced image sizes and attack surfaces by separating build and runtime environments.
- **Nginx Gateway:** Implemented a dedicated Nginx reverse proxy with SSL termination, SPA routing, and API proxying.
- **Infrastructure as Code:** Created `docker-compose.prod.yml` and `.env.example` for reproducible, secure deployments.

### 3. Backend Defense System
- **Security Middleware:** Integrated `helmet` for robust HTTP security headers.
- **Abuse Prevention:** Implemented `express-rate-limit` (100 req / 15 min) to mitigate DoS and brute-force attempts on identity endpoints.
- **CORS Hardening:** Restricted cross-origin requests to configurable safe origins.

## 🛠 Startup Flow & Session Management (2026-03-12)
- **Strict TOS Enforcement:** Configured `App.tsx` and `gameStore.ts` so that `tosAccepted` and `isAuthenticated` are reset on every new session.
- **Linear Routing Flow:** Mandatory TOS acceptance -> Welcome Page (Login/Signup) -> Authenticated Dashboard.
- **Unified Auth State:** Authenticated routes now correctly include the `/mnemonic` path for new users.

## 📦 Source Control
- **Branch:** `main`
- **Latest Commit:** `feat: security & infrastructure overhaul (v0.9-NIGHTLY)`
- **Current State:** Hardened storage, production Docker/Nginx configs, and backend security middleware active.

## 📋 Next Steps
- [ ] **Social Recovery:** Implement actual Shamir's Secret Sharing in `socialRecovery.ts`.
- [ ] **Real Connectivity:** Transition from mock wallet balances to real blockchain indexing (ethers.js / kaspa-wasm).
- [ ] **Secret Management:** Move from `.env` files to a secure vault for production.
- [ ] **WebAuthn Integration:** Add biometric-backed session signing for high-value transactions.

---
*Hardened Nightly (v0.9-NIGHTLY) Audit & Implementation Complete.*
