# QUICK START GUIDE - CivicVerse Frontend v2.0

## Installation

```bash
cd /home/frybo/civicverse-frontend
npm install
```

## Run Development Server

```bash
npm run dev
```

Opens automatically at `http://localhost:3000`

## Demo Credentials

**Login:**
- Civic ID: `demo-user-001`
- Password: `password123`

**Or create a new account:**
- Fill in any username and Civic ID
- Set a password

## What's Included

### ✨ Authentication
- **Login Page** - Civic ID authentication with validation
- **Signup Page** - 2-step signup form with password confirmation
- **Session Persistence** - Auto-restore login state

### 🎮 Core Game Features
1. **Dashboard** - Profile, wallet, stats, mission progress
2. **Missions** - Browse, accept, track, and complete civic missions
3. **Wallet** - View balance, send CIVIC, transaction history
4. **Governance** - Vote on community proposals in real-time

### 🎨 UI/UX Features
- Dark theme with Civic blue accent color
- Smooth Framer Motion animations
- Fully responsive design (mobile, tablet, desktop)
- Glassmorphic card design with borders
- Interactive sidebarnav with mobile menu

### 🧪 Demo Mode Features
- Full working demo without backend
- Auto-generated avatars using DiceBear API
- Simulated wallet with 1,250 CIVIC balance
- Mock missions with different difficulties
- Demo governance proposals with live voting

## Project Structure

```
civicverse-frontend/
├── src/
│   ├── pages/              # All page components
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── MissionsPage.tsx
│   │   ├── WalletPage.tsx
│   │   └── GovernancePage.tsx
│   ├── layouts/            # Main layout wrapper
│   │   └── MainLayout.tsx
│   ├── store/              # Zustand state management
│   │   └── gameStore.ts
│   ├── services/           # API client
│   │   └── api.ts
│   ├── contexts/           # Auth context
│   │   └── AuthContext.tsx
│   ├── App.tsx             # Main app with routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── index.html
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe code
- **Vite** - Fast build tool & dev server
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animation library
- **Zustand** - State management
- **React Router v6** - Navigation
- **Lucide React** - Icon library
- **Axios** - HTTP client

## Key Components

### GameStore (Zustand)
Global state for:
- User authentication
- Wallet management
- Mission tracking
- Game settings

### MainLayout
Responsive layout with:
- Sidebar navigation (collapsible on mobile)
- Active route highlighting
- User profile section
- Logout button

### Protected Routes
Routes require authentication:
- `/dashboard` - Main hub
- `/missions` - Mission list
- `/wallet` - Crypto wallet
- `/governance` - Voting

## Building for Production

```bash
npm run build
```

Creates optimized `dist/` folder for deployment.

## Deployment Options

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Traditional Server
```bash
npm run build
# Upload dist/ folder to your server
```

## Environment Variables

Create `.env.local`:

```env
VITE_API_URL=http://localhost:8000
VITE_NETWORK=testnet
VITE_DEMO_MODE=true
```

## Features Roadmap

### Current (v2.0)
- ✅ Civic ID authentication
- ✅ Mission system
- ✅ Wallet management
- ✅ Governance voting
- ✅ Dark theme UI
- ✅ Mobile responsive
- ✅ Demo mode

### Planned (v2.1+)
- [ ] The Foyer hub (News, Education, Commerce)
- [ ] Avatar customization
- [ ] Leaderboards
- [ ] Achievement system
- [ ] Real backend integration
- [ ] Blockchain wallet connection
- [ ] Video streaming for missions
- [ ] AR mission support

## Troubleshooting

**Port 3000 already in use:**
```bash
npm run dev -- --port 3001
```

**Dependencies issues:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Build errors:**
```bash
npm run build
```

## Support & Contributing

- 📖 [Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/Civicverse/civicverse/issues)
- 🤝 [Contributing Guide](./CONTRIBUTING.md)

---

**Built with ❤️ for the CivicVerse community**

**Last Updated:** February 3, 2026
