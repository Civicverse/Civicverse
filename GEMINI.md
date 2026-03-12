# Civicverse Development State

## 🚀 Active Environment
The services are running locally via `npm run start`.
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **API Server:** [http://localhost:3003](http://localhost:3003)

## 🛠 Fixes Applied (2026-03-12)

### 1. Startup Flow & Session Management
- **Strict TOS Enforcement:** Configured `App.tsx` and `gameStore.ts` so that `tosAccepted` and `isAuthenticated` are reset on every new session. The Terms of Service (TOS) is now the mandatory first page.
- **Linear Routing Flow:**
    1. **TOS Page:** Must be accepted (resets every session).
    2. **Welcome Page:** Choice between "Unlock Existing Wallet" (Login) or "Create New Identity" (Signup).
    3. **Authenticated Flow:**
        - **Returning Users:** Redirected to `/wallet` after successful login.
        - **New Users:** Redirected to `/mnemonic` (Memetic Wallet Password page) after signup, then to `/wallet`.

### 2. Terminology & Branding
- **Memetic Wallet Password:** Replaced all instances of "mnemonic" and "recovery phrase" with "Memetic Wallet Password" across the UI (`TOSPage.tsx`, `WelcomePage.tsx`, `SignupPage.tsx`, `MnemonicPage.tsx`).
- **Unified Auth State:** Authenticated routes now correctly include the `/mnemonic` path to allow new users to view their backup phrase without being prematurely redirected to the main dashboard.

### 3. Identity & Security
- **Non-Custodial Integrity:** Maintained the "Local-Only" principle by ensuring passwords and identity data are encrypted on-device and never saved in plain text or transmitted to the backend.

## 📦 Source Control
- **Branch:** `main`
- **Current State:** Startup order fixed, terminology updated, services running.

## 📋 Next Steps
- [ ] **Social Recovery:** Implement actual Shamir's Secret Sharing in `socialRecovery.ts`.
- [ ] **Real Connectivity:** Transition from mock wallet balances to real blockchain indexing.
- [ ] **Identity Library:** Integrate the "real" `@civicverse/civic-id` library.
- [ ] **Rust Migration:** Move Rust source files out of the frontend source into a dedicated crate.

---
*Updated context saved for next session.*
