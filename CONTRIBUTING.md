# Contributing to Civicverse

Thank you for your interest in contributing to Civicverse! This guide will help you get started.

## Getting Started

### Prerequisites
- Node.js 18+ (LTS)
- Git 2.30+
- macOS, Linux, or Windows (WSL2)
- GitHub account

### Setup Your Development Environment

```bash
# 1. Fork the repository on GitHub
# https://github.com/CivicverseHQ/Civicverse/fork

# 2. Clone your fork
git clone git@github.com:YOUR_USERNAME/Civicverse.git
cd Civicverse

# 3. Add upstream remote (for syncing with main repo)
git remote add upstream git@github.com:CivicverseHQ/Civicverse.git

# 4. Install dependencies
npm install --workspaces

# 5. Start development
npm run dev
# Frontend: http://localhost:5173
# Backend: http://localhost:3003
```

## Development Workflow

### 1. Create a Feature Branch

```bash
# Sync with upstream first
git fetch upstream
git checkout develop
git merge upstream/develop

# Create feature branch with descriptive name
git checkout -b feature/your-feature-name
# Examples:
# feature/improve-ai-pathfinding
# feature/add-marketplace-ui
# feature/fix-vault-decryption
```

### 2. Make Your Changes

Follow the code conventions in [README.md](README.md#-code-conventions):
- Use TypeScript with strict mode
- Use React hooks (functional components)
- Add JSDoc comments for public functions
- Keep components small and focused

### 3. Test Your Work

```bash
# Manual testing (QA checklist below)
npm run dev

# Browser testing
# - Frontend: http://localhost:5173
# - Network tab: No 404s
# - Console: No errors/warnings
# - Responsive: Test mobile (DevTools)
```

### 4. Commit with Clear Messages

Use conventional commit format:

```bash
git add .
git commit -m "feat: add marketplace listing UI"
git commit -m "fix: resolve vault decryption timeout"
git commit -m "docs: update CONTRIBUTING.md"
git commit -m "refactor: simplify enemy AI logic"
git commit -m "test: add unit tests for vault"
git commit -m "perf: optimize Three.js rendering"
git commit -m "style: format code with Prettier"
git commit -m "chore: update dependencies"
```

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create PR on GitHub with description:
# - What: Brief description of changes
# - Why: Problem you're solving
# - How: Your approach
# - Testing: How to verify the changes
# - Screenshots/Videos: If UI changes
```

### 6. Address Review Feedback

```bash
# Make requested changes
git add .
git commit -m "refactor: address review feedback"
git push origin feature/your-feature-name
# GitHub PR auto-updates
```

## Code Standards

### TypeScript Rules
```typescript
// ✅ Good: Type everything
interface User {
  id: string;
  name: string;
  createdAt: Date;
}

const getUser = (id: string): Promise<User> => {
  // ...
};

// ❌ Bad: Using 'any'
const getUser = (id: any) => {
  // ...
};
```

### React Components
```typescript
// ✅ Good: Functional component with TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
}) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  );
};

// ❌ Bad: Class component or no types
class Button extends React.Component {
  render() {
    return <button onClick={this.props.onClick}>{this.props.label}</button>;
  }
}
```

### File Organization
```
frontend/src/
├── components/
│   ├── Button.tsx          # Single component file
│   ├── Card.tsx
│   └── index.ts            # Export all from components/
├── pages/
│   ├── HomePage.tsx
│   └── WalletPage.tsx
├── lib/
│   ├── vault.ts            # Utilities and helpers
│   └── mnemonic.ts
└── types/
    └── index.ts            # Shared type definitions
```

## QA Checklist (Before PR)

### Frontend
- [ ] No TypeScript errors: `npm run dev` shows no red squiggles
- [ ] No console errors: Browser DevTools clean
- [ ] No console warnings: Network requests completion
- [ ] Mobile responsive: Test at 320px width
- [ ] Keyboard navigation: Tab through UI
- [ ] Dark mode tested: Theme applies correctly
- [ ] Performance: Lighthouse score 85+

### Backend
- [ ] No TypeScript errors
- [ ] No console errors/warnings
- [ ] API endpoints working: Test with curl or Postman
- [ ] CORS headers correct
- [ ] Error handling: Returns proper HTTP status codes
- [ ] Database consistency: No orphaned data

### Game (if applicable)
- [ ] Player spawns correctly
- [ ] WASD movement works
- [ ] Mouse aiming responsive
- [ ] Shooting hits enemies
- [ ] Enemy AI pathfinding smooth
- [ ] Game over condition triggers
- [ ] Chat messages display
- [ ] Timer counts down

## Areas Needing Contributions

### Frontend (React/TypeScript)

#### 1. Enemy AI Improvement
- **Location**: `frontend/src/components/BattleRoyaleGame.tsx`
- **Task**: Improve enemy pathfinding using A* algorithm
- **Current**: Random movement only
- **Goal**: Smart navigation around obstacles
- **Difficulty**: Medium
- **Skills**: TypeScript, game development, algorithms

#### 2. Game Animations & Particles
- **Location**: `frontend/src/components/BattleRoyaleGame.tsx`
- **Task**: Add sprite animations and particle effects
- **Current**: Static sprites
- **Goal**: Hit animations, death particles, muzzle flashes
- **Difficulty**: Medium
- **Skills**: Three.js, game animation

#### 3. Mobile Responsiveness
- **Location**: All pages in `frontend/src/pages/`
- **Task**: Fix touch controls and responsive layout
- **Current**: Desktop-first
- **Goal**: Fully responsive at 320px width
- **Difficulty**: Easy
- **Skills**: CSS, responsive design, testing

#### 4. Accessibility (WCAG 2.1)
- **Location**: All components
- **Task**: Add ARIA labels, keyboard support
- **Current**: No accessibility features
- **Goal**: WCAG 2.1 AA compliance
- **Difficulty**: Medium
- **Skills**: Accessibility, HTML semantics

### Backend (Express)

#### 1. Marketplace API
- **Location**: `backend/index.js`
- **Task**: Create RESTful API for peer marketplace
- **Endpoints**:
  - `POST /api/listings` – Create new listing
  - `GET /api/listings` – Browse listings
  - `POST /api/orders` – Create order
  - `GET /api/orders/:id` – Order status
- **Difficulty**: Medium
- **Skills**: Express, REST API design, database

#### 2. Vault Backend (Optional)
- **Location**: `backend/index.js`
- **Task**: Encrypted vault storage
- **Features**:
  - Store encrypted vault backups
  - Recover vault with password
  - Zero-knowledge server
- **Difficulty**: Hard
- **Skills**: Cryptography, backend security

#### 3. Database Integration
- **Location**: `backend/index.js`
- **Task**: Replace in-memory with SQLite
- **Current**: Data lost on restart
- **Goal**: Persistent storage
- **Difficulty**: Easy
- **Skills**: SQL, database design

### Cryptography & Security

#### 1. Shamir Secret Sharing
- **Task**: Implement M-of-N recovery threshold
- **Location**: `frontend/src/lib/vault.ts`
- **Goal**: Split seed into 5, require 3 to recover
- **Difficulty**: Hard
- **Skills**: Cryptography, secret sharing algorithms
- **Resource**: [Shamir's Secret Sharing](https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing)

#### 2. Zero-Knowledge Proofs
- **Task**: Implement ZK proofs for reputation
- **Goal**: Prove reputation without revealing identity
- **Difficulty**: Very Hard
- **Skills**: Advanced cryptography, zkSNARKs
- **Resource**: [ZK resources](https://z.cash/technology/zksnarks/)

#### 3. EdDSA Signatures
- **Task**: Add Ed25519 signature support
- **Location**: `frontend/src/lib/vault.ts`
- **Goal**: Sign and verify claims cryptographically
- **Difficulty**: Hard
- **Skills**: Elliptic curve cryptography, Ed25519

### Game Development (Three.js)

#### 1. Level Design
- **Task**: Create multi-stage dungeons
- **Current**: Single 3x3 room
- **Goal**: Progressive difficulty, boss encounters
- **Difficulty**: Hard
- **Skills**: Game design, Three.js, level editing

#### 2. 3D Assets
- **Task**: Create tileset, enemies, power-ups
- **Tools**: Blender or Spline for modeling
- **Format**: GLB/GLTF for Three.js
- **Difficulty**: Medium
- **Skills**: 3D modeling, game art

#### 3. Multiplayer Networking
- **Task**: Real P2P multiplayer (WebRTC)
- **Current**: Local AI opponents
- **Goal**: Play against real players
- **Difficulty**: Hard
- **Skills**: WebRTC, multiplayer architecture
- **Resource**: [WebRTC MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

#### 4. Leaderboards
- **Task**: Global kill leaderboard
- **Location**: Backend + frontend
- **Goal**: Track top killers across all games
- **Difficulty**: Medium
- **Skills**: Database design, caching, real-time updates

## Testing

### Manual Testing

**Frontend:**
```bash
npm run dev
# Test at http://localhost:5173

# Checklist:
# - [ ] No TypeScript errors
# - [ ] No console errors
# - [ ] All buttons clickable
# - [ ] Forms submit correctly
# - [ ] Mobile responsive
# - [ ] Dark theme applied
```

**Backend:**
```bash
cd backend && npm start
# Test API endpoints

# Examples:
curl http://localhost:3003/api/status
# Response: { "status": "ok" }
```

### Automated Testing (Future)
We'll soon add:
- Unit tests with Jest
- E2E tests with Playwright
- Type checking with TypeScript
- Linting with ESLint

## Debugging

### Frontend
```bash
# In browser DevTools (F12)

# Console - check for errors
console.log('Debug info')

# Network tab - check API calls
# Watch for 404s or slow requests

# React DevTools - inspect component state
# Three.js Inspector - debug 3D rendering
```

### Backend
```bash
# In terminal
NODE_ENV=development npm start
# Shows detailed error messages

# Check logs
console.log('Debug:', variable)
```

## Performance Optimization

### Frontend
```typescript
// ✅ Good: Memoization for expensive renders
const Enemy = React.memo(({ id, health }) => {
  return <div>{health}</div>;
});

// Use useCallback for stable references
const handleClick = useCallback(() => {}, []);

// Use useMemo for expensive computations
const totalHealth = useMemo(
  () => enemies.reduce((sum, e) => sum + e.health, 0),
  [enemies]
);
```

### Game Rendering
```typescript
// ✅ Good: Batch geometry updates
geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
geometry.computeBoundingSphere();

// Use LoD (Level of Detail) for distant objects
// Optimize physics step count
world.step(1 / 60, 0.016, 3); // 3 sub-steps
```

## Common Issues & Solutions

### "Cannot find module" errors
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Port already in use
```bash
# Change port in vite.config.js
# Or kill process using port
# macOS/Linux:
lsof -i :5173
kill -9 <PID>

# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Git merge conflicts
```bash
# Let VSCode resolve automatically if possible
# Or manual merge:
git diff
# Edit conflicted files
git add .
git commit -m "chore: resolve merge conflicts"
```

## Getting Help

- **GitHub Issues**: Ask questions or report bugs
- **GitHub Discussions**: General questions
- **Discord**: Real-time chat with team
- **Email**: dev@civicverse.io

## Recognition

Contributors are recognized in:
- [CONTRIBUTORS.md](CONTRIBUTORS.md)
- GitHub "Contributors" page
- Monthly dev newsletter
- Civicverse Hall of Fame

## Code of Conduct

- Be respectful and inclusive
- No harassment or discrimination
- Constructive feedback only
- Report violations to conduct@civicverse.io

## Next Steps for Reviewers

### For Code Review
1. Request changes or approve
2. Comment on specific lines
3. Check for security issues
4. Verify performance impact
5. Merge when ready

### For Maintainers
1. Release process in [RELEASE.md](RELEASE.md)
2. Version bumping (MAJOR.MINOR.PATCH)
3. Changelog updates
4. GitHub releases with notes
5. Docker image tagging

---

**Thank you for building Civicverse! Your contributions matter. 💜**
