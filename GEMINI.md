# Civicverse Development State

## 🚀 Active Environment
The services are running locally (non-Docker) via `npm run start:backend` and `npm run start:frontend`.

- **Frontend:** [http://localhost:3000](http://localhost:3000) (Vite/React)
- **API Server:** [http://localhost:3003](http://localhost:3003) (Identity, Jobs, Governance)
- **Game Server:** [http://localhost:8080](http://localhost:8080) (Multiplayer, UBI, Matches)

## 🛠 Fixes Applied (2026-03-01)

### 1. Authentication & Persistence
- **State Rehydration:** Implemented `initialize` method in `gameStore.ts` to restore user sessions and wallet addresses from `localStorage` on page refresh.
- **Login Persistence:** Fixed `LoginPage.tsx` to handle existing local identities. Users are now prompted for their password to unlock their non-custodial vault instead of being auto-logged in with empty state.
- **Secure Mnemonic Flow:** Introduced `tempMnemonic` in the global store. It is generated during signup and held in memory for the `MnemonicPage` to display, but is never persisted to `localStorage`, maintaining non-custodial security standards.

### 2. Navigation & Routing
- **Infinite Loop Resolution:** Fixed "Maximum update depth exceeded" error by refactoring `App.tsx`. Replaced recursive `TOSGuard`/`ProtectedRoute` components with a linear, centralized routing switch.
- **Strict Flow Enforcement:**
    1. **TOS:** Must be accepted first in every session.
    2. **Auth Check:** Redirects to `/welcome` if no active session.
    3. **Protected Area:** Only accessible after rehydration or login.
- **Clean Redirects:** Removed redundant `useEffect` navigation logic from individual pages (`MnemonicPage`, `WalletPage`) to let `App.tsx` handle the source of truth.

### 3. UI & Styling
- **Missing Assets:** Added missing CSS utility classes (`bg-gradient-dark`, `bg-civic-*`, etc.) to `index.css` that were causing blank screens in `MainLayout`.
- **Component Stability:** Fixed a crash in `AnimatedButton` caused by a missing color reference (`neon-orange`) and added defensive checks to `MnemonicPage` to prevent `split()` errors on null values.

## 📦 Source Control
- **Branch:** `main`
- **Latest Commit:** includes all auth rehydration, routing refactor, and CSS fixes.

## 📋 Next Steps
- [ ] **Social Recovery:** Implement actual Shamir's Secret Sharing in `socialRecovery.ts` to provide a non-custodial path for lost passwords.
- [ ] **Real Connectivity:** Transition from mock wallet balances to real blockchain indexing (Monero/ETH).
- [ ] **Identity Library:** Integrate the "real" `@civicverse/civic-id` library once it's moved out of the frontend source.
- [ ] **Rust Migration:** Move Rust source files (`main.rs`, `genesis.rs`, etc.) out of the React `frontend/src/` folder into a dedicated crate.

---
*Next session: Start by verifying the login/signup flow and proceed to Social Recovery or Real-time Blockchain integration.*
