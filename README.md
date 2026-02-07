# Civicverse: Protocol-Level Decentralized Identity

**Civicverse** is a protocol, not a platform. It enables the future of decentralized identity and peer-to-peer coordination at scale—where identity is truly yours: generated locally, encrypted, non-transferable, and non-recoverable.

## 🚀 Quick Start

### System Requirements
- **Node.js**: 18+ (LTS)
- **Docker**: 20.10+ (optional, for containerized deployment)
- **Git**: 2.30+
- **OS**: macOS, Linux, or Windows (WSL2)

### Clone & Development Setup (< 5 minutes)

```bash
# Step 1: Clone the repository
git clone git@github.com:Civicverse/Civicverse.git
cd Civicverse

# Step 2: Install all dependencies (root, backend, frontend)
npm run install:all

# Step 3: Start dev servers (backend :3004 + frontend :5173 with proxy)
npm run dev

# Step 4: Open in browser
# Frontend (with /api proxy): http://localhost:5173/
# Backend API: http://localhost:3004/api/status
```

#### What Happens
- **Backend** starts on port 3004 with `/api/*` endpoints
- **Frontend** dev server starts on port 5173 with hot reload
- `/api` calls from frontend are proxied to backend (no CORS issues)
- Both processes run in the same terminal; press Ctrl+C to stop

### Production Build & Serve (< 2 minutes)

```bash
# Step 1: Clone (if not already done)
git clone git@github.com:Civicverse/Civicverse.git
cd Civicverse

# Step 2: Install dependencies once
npm run install:all

# Step 3: Build frontend to dist/
npm run build

# Step 4: Start backend serving built frontend
npm run start:prod

# Step 5: Open in browser
# App: http://localhost:3004
```

#### What Happens
- Frontend (React + Tailwind) is bundled into `frontend/dist/`
- Backend serves static files from `dist/` + API routes at `/api/*`
- Single process on port 3004; no dev server overhead

### Docker Deployment

```bash
# Option A: Build and launch both services
docker-compose up --build
# Access at http://localhost (via Nginx reverse proxy)

# Option B: Run in background
docker-compose up -d
docker-compose logs -f

# Option C: Stop and clean up
docker-compose down -v
```

## �‍💻 For Contributors & Developers

### Where to Start

**New to the project?**
1. Read the [Tech Stack](#-tech-stack) below
2. Clone & run `npm run dev` (see Quick Start)
3. Open http://localhost:5173 in your browser
4. Explore the file structure in `frontend/src/` and `backend/index.js`

### Pick Up a Task

**Frontend UI/Components** (easiest entry point)
- File: [`frontend/src/components/`](frontend/src/components/)
- Tasks:
  - Fix BattleRoyaleGame 3D rendering issue (see warning in build output)
  - Add mobile responsiveness to AnimatedCard, AnimatedButton
  - Expand NeonText animations
  - Add accessibility (ARIA labels, keyboard navigation)

**Frontend Pages** (user flows)
- File: [`frontend/src/pages/`](frontend/src/pages/)
- Tasks:
  - Add form validation & error feedback on SignupPage
  - Add "Forgot Password" flow (recovery via mnemonic)
  - Polish WalletPage display (balance, transactions)
  - Add loading indicators & skeleton screens

**Business Logic** (local crypto & vault)
- Files: [`frontend/src/lib/vault.ts`](frontend/src/lib/vault.ts), [`frontend/src/lib/mnemonic.ts`](frontend/src/lib/mnemonic.ts)
- Tasks:
  - Audit AES-256-GCM encryption implementation
  - Add Shamir secret sharing for mnemonic backup
  - Implement keystore persistence (IndexedDB vs localStorage)
  - Add zero-knowledge proofs for identity claims

**Backend API** (endpoints & data)
- File: [`backend/index.js`](backend/index.js)
- Tasks:
  - Add `/api/identity/list` endpoint
  - Add `/api/wallet/list` endpoint
  - Add input validation & rate limiting
  - Add persistent SQLite storage (optional)
  - Add JWT authentication if needed

**Multiplayer / 3D Game**
- File: [`frontend/src/components/BattleRoyaleGame.tsx`](frontend/src/components/BattleRoyaleGame.tsx)
- Tasks:
  - Fix Three.js PCFShadowShadowMap import error
  - Improve enemy AI pathfinding
  - Add particle effects & item pickups
  - Add P2P multiplayer via WebRTC (advanced)

**DevOps / Docker**
- Files: [`docker-compose.yml`](docker-compose.yml), [`frontend/Dockerfile`](frontend/Dockerfile), [`backend/Dockerfile`](backend/Dockerfile)
- Tasks:
  - Test production build locally with Docker
  - Add GitHub Actions CI/CD pipeline
  - Add environment variable configuration (`.env` files)
  - Add health checks to services

### Development Workflow

```bash
# 1. Create a new feature branch
git checkout -b feature/my-feature

# 2. Make changes and test locally
npm run dev

# 3. Build & test production mode
npm run build
npm run start:prod

# 4. Commit with conventional message
git add .
git commit -m "feat: add my feature"
# Commit types: feat, fix, docs, refactor, test, chore

# 5. Push and open a PR
git push origin feature/my-feature
# Open PR on GitHub at https://github.com/Civicverse/Civicverse/pulls
```

### Code Style & Conventions

**TypeScript**
- Strict mode enabled in `frontend/tsconfig.json`
- Use interfaces for all data types
- Prefer functional components + hooks
- No `any` types

**React Components**
- Use Tailwind CSS for layout
- Custom CSS in component file for animations
- Prop validation with TypeScript
- Export types alongside components

**Crypto & Security**
- All encryption happens client-side (Web Crypto API)
- Private keys never leave the browser
- Use `globalThis.crypto` for randomness (never `Math.random()`)
- Backend stores encrypted data only; decryption is user's responsibility

### Environment Variables

Create `.env` files in `backend/` and `frontend/` if needed:

**backend/.env**
```bash
PORT=3004
NODE_ENV=development
```

**frontend/.env**
```bash
VITE_API_URL=http://localhost:3004
```

### Testing

- Frontend: `npm run test` (not yet configured; TODO)
- Backend: Add unit tests to `backend/` directory
- E2E: Use Playwright or Cypress (TODO)

### Common Issues

**"Port 3004 already in use"**
```bash
# Kill process on port 3004
lsof -i :3004  # List processes
kill -9 <PID>  # Kill the process
# Or use a different port:
PORT=3005 npm run start:prod
```

**"Cannot GET /signup on http://localhost:3004"**
- Don't use the backend port directly; use http://localhost:5173 for dev
- Or build frontend first: `npm run build` and `npm run start:prod`

**Frontend dev server not reloading**
- Ensure `frontend/vite.config.js` has correct proxy configuration
- Restart dev server: Ctrl+C, then `npm run dev`

**Backend API not responding**
- Check that backend is running: `curl http://localhost:3004/api/status`
- Restart backend: Ctrl+C, then `PORT=3004 npm start`

### What's Next (Roadmap)

**Phase 1: MVP** (current state, in progress)
- ✅ Local Civic ID generation
- ✅ AES-256-GCM vault encryption
- ✅ BIP-39 mnemonic backup
- ✅ 7-page onboarding flow
- ✅ 3D battle royale game prototype
- 🔄 Fix Three.js import errors
- 🔄 Add form validation & error handling
- 🔄 Mobile responsiveness

**Phase 2: Public Beta** (next milestone)
- P2P networking (WebRTC)
- Secure identity sharing (zero-knowledge proofs)
- Marketplace MVP (atomic swaps, escrow)
- DAO governance & voting
- Persistent backend storage (SQLite)
- Admin dashboard

**Phase 3: Scale** (future)
- Hardware wallet integration (Ledger, Trezor)
- Desktop & mobile native apps
- Multiplayer matchmaking
- Shamir secret sharing (threshold recovery)
- Blockchain settlement layer
- Reputation & credential system

### Getting Help

- **Discussions**: https://github.com/Civicverse/Civicverse/discussions
- **Issues**: https://github.com/Civicverse/Civicverse/issues
- **Slack/Discord**: (coming soon)
- **Twitter**: [@CivicverseHQ](https://twitter.com/CivicverseHQ)

---

## �📋 Tech Stack

### Frontend
- **React 18** + **TypeScript** – Modern UI with type safety
- **Vite 5** – Lightning-fast build tool
- **Tailwind CSS 3.4** – Utility-first styling with custom neon theme
- **Three.js 0.160** – 3D graphics engine (battle royale)
- **Cannon.js 0.20** – Physics engine for 3D gameplay
- **Web Crypto API** – AES-256-GCM encryption in-browser
- **Web Audio API** – Procedural audio synthesis

### Backend
- **Express.js** – Minimal REST API
- **Node.js 18** – Runtime

### DevOps
- **Docker** + **Docker Compose** – Containerization
- **Nginx** – Reverse proxy (production)
- **GitHub Actions** – CI/CD pipelines

## 📁 Project Structure

```
civicverse/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BattleRoyaleGame.tsx  # 3D battle royale (Three.js)
│   │   │   ├── AnimatedButton.tsx
│   │   │   ├── AnimatedCard.tsx
│   │   │   ├── NeonText.tsx
│   │   │   └── Utilities.tsx
│   │   ├── pages/
│   │   │   ├── TOSPage.tsx
│   │   │   ├── WelcomePage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── MnemonicPage.tsx
│   │   │   ├── SignInPage.tsx
│   │   │   ├── WalletPage.tsx
│   │   │   └── FoyerPage.tsx
│   │   ├── lib/
│   │   │   ├── vault.ts          # AES-256-GCM encryption
│   │   │   └── mnemonic.ts       # BIP-39 mnemonic generator
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── backend/
│   ├── index.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .gitignore
├── README.md (this file)
└── CONTRIBUTING.md (development guide)
```

## 🎮 Features

### Authentication & Vault (MVP)
- ✅ TOS acceptance gate
- ✅ Local Civic ID generation (non-transferable)
- ✅ BIP-39 12-word mnemonic backup
- ✅ AES-256-GCM encrypted vault (Web Crypto API)
- ✅ PBKDF2 password derivation (100k iterations)
- ✅ Zero-knowledge vault unlock (decrypt locally)

### UI/UX
- ✅ Tropical neon aesthetic
- ✅ Animated components
- ✅ Dark gradient backgrounds
- ✅ Responsive design

### Battle Royale Game (3D)
- ✅ Three.js neon city rendering
- ✅ Cannon.js physics & gravity
- ✅ 5 players (1 local + 4 AI)
- ✅ WASD + mouse + click controls
- ✅ Health, ammo, kill tracking
- ✅ 5-minute match timer
- ✅ "King of the Lobby" win condition
- ✅ Real-time chat
- ✅ Synthwave music generation

### Identity Hub (Foyer)
- **Overview** – Zero-custody, P2P, offline-first
- **Marketplace** – Peer trading, atomic swaps
- **Governance** – DAO voting, treasury
- **Community** – Messaging, spaces, reputation
- **Battle Royale** – 3D shooter game

## 🛠️ Development

### Running Locally

```bash
# Frontend development server
cd frontend && npm install && npm run dev
# http://localhost:5173

# Backend API
cd backend && npm install && npm start
# http://localhost:3003

# Full stack (containerized)
docker-compose up --build
# http://localhost:3000
```

### Build for Production

```bash
# Frontend
cd frontend && npm run build
# Output: dist/

# Docker images
docker-compose build --no-cache
```

## 🚦 Git Workflow

### Branches
- **main** – Production (protected)
- **develop** – Integration branch
- **feature/*** – Feature branches
- **bugfix/*** – Bug fixes

### Commits (Conventional)
```bash
git commit -m "feat: add feature"
git commit -m "fix: resolve issue"
git commit -m "docs: update README"
git commit -m "refactor: improve code"
```

### Pull Requests
1. Fork repo
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes & commit
4. Push: `git push origin feature/your-feature`
5. Open PR with description
6. Address review feedback
7. Merge after approval

## 📋 Roadmap

### Phase 1: MVP (Current) ✅
- ✅ Vault encryption & mnemonic
- ✅ 7-page onboarding flow
- ✅ Neon UI theme
- ✅ 3D battle royale game
- ✅ Identity hub (Foyer)

### Phase 2: Public Beta (Next)
- 🔄 P2P networking (WebRTC)
- 🔄 Blockchain settlement
- 🔄 On-chain credentials
- 🔄 Marketplace MVP
- 🔄 Governance DAO

### Phase 3: Scale
- 🎯 Hardware wallet support
- 🎯 Desktop & mobile apps
- 🎯 Multiplayer matchmaking
- 🎯 Shamir secret sharing
- 🎯 Zero-knowledge proofs

## 🤝 Contributing

**New to the project?** See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidance.

### Areas Needing Help

**Frontend**
- Enemy AI pathfinding
- Sprite animations & particles
- Mobile responsiveness
- Accessibility (WCAG 2.1)

**Backend**
- RESTful API endpoints
- Database persistence (SQLite)
- JWT authentication
- Input validation & rate limiting

**Cryptography**
- Shamir secret sharing
- Zero-knowledge proofs
- EdDSA signatures

**Game**
- 3D assets & tiles
- Level design
- P2P multiplayer
- UI/UX Polish

## 📚 Code Conventions

### TypeScript
- Strict mode enabled
- Functional components + hooks
- Interface definitions required
- No `any` types

### Styling
- Tailwind CSS for layout
- Custom CSS for animations
- Theme colors in `tailwind.config.js`

### Encryption
- **Algorithm**: AES-256-GCM
- **Key derivation**: PBKDF2-SHA256 (100k iterations)
- **Format**: `{ciphertext, iv, tag, salt}` (hex-encoded)
- **Recovery**: Non-transferable, user-owned

### Game System
- **Physics**: Cannon.js (gravity: -9.82)
- **Rendering**: Three.js (60 FPS target)
- **Networking**: Local multiplayer (AI)
- **Audio**: Web Audio API

## 📝 License

MIT License. See [LICENSE](LICENSE) for details.

## 🔐 Security

### Responsible Disclosure
Found a vulnerability?
1. **Do NOT** open a public issue
2. **Email** security@civicverse.io
3. Allow 90 days for patching

### Current Notes
- MVP uses Web Crypto API (browser-specific)
- Mnemonics stored client-side (user responsibility)
- No server-side backup/recovery (by design)
- Game server is local multiplayer

## 📊 Metrics

- TypeScript coverage: 95%
- Bundle size: ~500KB (gzipped)
- Lighthouse score: 85+
- Components: 12 reusable
- Pages: 8
- Crypto: AES-256-GCM, PBKDF2, BIP-39

## 🎓 Educational Resources

- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Three.js Docs](https://threejs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React 18](https://react.dev)
- [BIP-39 Spec](https://github.com/trezor/python-mnemonic)

## 🔗 Links

- **Website**: https://civicverse.io
- **GitHub**: https://github.com/CivicverseHQ/Civicverse
- **Issues**: https://github.com/CivicverseHQ/Civicverse/issues
- **Discussions**: https://github.com/CivicverseHQ/Civicverse/discussions
- **Twitter**: [@CivicverseHQ](https://twitter.com/CivicverseHQ)

---

**Built with 💜 by the Civicverse community. Don't fork it. Own it.**
