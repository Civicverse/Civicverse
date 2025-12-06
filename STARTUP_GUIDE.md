# Civicverse Demo - Startup Guide

## Overview

Civicverse is a production-ready 3D interactive demo featuring a neon-themed virtual city with player controls, a decentralized governance system, marketplace, mining operations, and multi-token economics. The entire system runs locally using Docker and requires no external dependencies.

## Prerequisites

### System Requirements
- **Docker** (19.03+) and **Docker Compose** (1.25+)
- **Linux/macOS/Windows with Docker Desktop**
- **2GB+ RAM** available
- **Modern web browser** (Chrome, Firefox, Edge, Safari)
- **Disk space**: ~2GB for Docker images and dependencies

### Installation

#### Linux
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### macOS
```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
# Includes Docker and Docker Compose
```

#### Windows
```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
# Includes Docker and Docker Compose
```

---

## Quick Start (60 seconds)

```bash
# 1. Clone the repository
git clone https://github.com/Civicverse-Backup-Main/Foyer.git
cd Foyer

# 2. Start the entire system
docker compose up -d

# 3. Wait 5 seconds for services to initialize
sleep 5

# 4. Open your browser
# Visit: http://localhost:3000
```

**Done!** The demo is now running locally.

---

## Detailed Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/Civicverse-Backup-Main/Foyer.git
cd Foyer
```

### Step 2: Verify Docker Installation

```bash
docker --version
# Docker version 20.10.x or higher

docker compose version
# Docker Compose version 2.x.x or higher
```

### Step 3: Start Services

```bash
# Start all services in background
docker compose up -d

# Monitor startup progress
docker compose logs -f civicverse-frontend
```

Wait for output: `✔ Container civicverse-civicverse-frontend-1  Started`

### Step 4: Verify Services

```bash
# Check all containers running
docker compose ps

# Expected output:
# NAME                                  STATUS
# civicverse-civicverse-frontend-1      Up X seconds
# civicverse-civicverse-backend-1       Up X seconds
# civicverse-kaspa-node-1               Up X seconds
# civicverse-monerod-1                  Up X seconds
```

### Step 5: Access the Application

Open your web browser and navigate to:

```
http://localhost:3000
```

---

## Usage Guide

### 3D City Controls

#### Movement
- **W** or **↑** - Move forward
- **A** or **←** - Strafe left
- **S** or **↓** - Move backward
- **D** or **→** - Strafe right

#### Camera
- **Mouse Drag** - Rotate camera around player
- **Scroll** - Zoom in/out (when applicable)
- **Auto-Follow** - Camera automatically tracks player position

### Character
- Your avatar appears as an articulated character model
- Limbs animate smoothly when moving
- Character faces the direction of movement

### UI Modules

Click buttons on the left sidebar to access different modules:

#### Dashboard
- View system status and statistics
- Monitor network health
- Check treasury balance (CVT tokens)

#### Voting
- Participate in governance proposals
- View active votes
- Cast your vote

#### DEX (Decentralized Exchange)
- Swap CVT ↔ PXL tokens
- View trading pairs
- Monitor exchange rates

#### Marketplace
- Browse available items
- Purchase with CVT
- View seller ratings

#### Social
- Post updates to the community
- View posts from other players
- Build your reputation

#### Onboarding
- Get started with Civicverse
- Learn basic mechanics
- Unlock tutorial rewards

#### ZK Quests
- Complete zero-knowledge proof challenges
- Earn verification credentials
- Progress through quest tiers

#### Character
- Customize your avatar
- View character stats
- Manage inventory

#### Wallet
- Check current balance (CVT)
- View transaction history
- Manage addresses

#### Miner
- Start mining operations
- Monitor earned tokens
- Adjust mining parameters

#### Governance
- View governance proposals
- Stake tokens for voting power
- Participate in protocol decisions

#### UBI (Universal Basic Income)
- Claim periodic UBI distributions
- View eligibility status
- Track claim history

#### News
- Read latest system announcements
- View community updates
- Subscribe to alerts

#### Education
- Access learning resources
- Complete tutorials
- Earn certificates

---

## Environment

### 3D City Features

#### Buildings
- **7 detailed procedural buildings** with window grids
- Metallic materials with emissive properties
- Realistic proportions and spacing

#### Lighting
- **12 ambient street lamps** with warm glow
- Dynamic directional lighting
- Sky gradient background

#### Points of Interest
- **Central Plaza** with animated fountain
- **Trading Billboard** displaying live token prices
- **Street Grid** with 20-unit spacing

#### Atmosphere
- Neon synthwave aesthetic
- Cyan (#00ffff) and magenta (#ff006f) color scheme
- Dark background with glowing accents

---

## Token System

### CVT (Civic Token)
- Primary in-game currency
- Used for marketplace purchases
- Earned through mining
- Required for staking and governance
- **Starting Balance**: 1,500 CVT

### PXL (Pixel Token)
- Secondary currency
- Traded on DEX
- Used for special items
- Platform incentive mechanism
- **Starting Balance**: 50 PXL

### Trading
- DEX allows 1:0.05 swap ratio (100 CVT = 5 PXL)
- Prices updated in real-time on billboard
- No fees on demo trades

---

## Docker Services

### civicverse-frontend
- **Port**: 3000
- **Purpose**: React + Three.js 3D interface
- **Stack**: Node 18 (build) → nginx (runtime)

### civicverse-backend
- **Port**: 5000
- **Purpose**: API proxy and data aggregation
- **Stack**: Node.js + Express

### kaspa-node
- **Port**: 16110
- **Purpose**: Mock blockchain node
- **Stack**: Node.js stub service

### monerod
- **Port**: 18081
- **Purpose**: Mock privacy coin daemon
- **Stack**: Node.js stub service

---

## Troubleshooting

### Port Already in Use
```bash
# If port 3000 is occupied
docker compose down
# Kill the process on port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
docker compose up -d
```

### Containers Not Starting
```bash
# View detailed logs
docker compose logs civicverse-frontend

# Rebuild images
docker compose down
docker compose build --no-cache
docker compose up -d
```

### High Memory Usage
```bash
# Reduce container resource limits (optional)
# Edit docker-compose.yml and add:
# mem_limit: 512m
# cpus: '1.0'

docker compose up -d
```

### Cannot Connect to http://localhost:3000
```bash
# Check if service is running
docker compose ps

# Check service logs
docker compose logs civicverse-frontend

# Verify port is listening
curl http://localhost:3000
```

### Browser Shows Blank Page
```bash
# Clear browser cache (Ctrl+Shift+Delete)
# Hard refresh (Ctrl+Shift+R)
# Check browser console for JavaScript errors (F12)
# Check Docker logs: docker compose logs civicverse-frontend
```

---

## Performance Optimization

### For Low-End Hardware
1. **Reduce building complexity**: Edit `frontend/demo/src/components/CityScene.jsx`
2. **Disable shadows**: Remove shadow-related properties from materials
3. **Lower resolution**: Set canvas pixel ratio to 0.75x

### For High-End Hardware
1. **Enable post-processing**: Add bloom, ambient occlusion effects
2. **Increase draw distance**: Render more city buildings
3. **Add particle effects**: Environment particles, water splashes

### Monitoring Performance
- Open browser DevTools (F12)
- Check **Performance** tab for frame rates
- Target 60 FPS for smooth gameplay

---

## Development

### Project Structure
```
frontend/
├── demo/
│   ├── src/
│   │   ├── App.jsx           # Main app component
│   │   ├── components/
│   │   │   ├── CityScene.jsx # 3D rendering engine
│   │   │   ├── HUD.jsx       # UI overlay
│   │   │   ├── ModuleRouter.jsx
│   │   │   └── modules/      # 14 feature modules
│   │   └── styles.css        # Global styling
│   ├── vite.config.js
│   └── package.json
├── Dockerfile                # Multi-stage build
└── index.html               # Entry point

backend/
├── index.js                 # Express server
└── package.json

kaspa-node/
└── index.js                 # Mock blockchain

monerod/
└── index.js                 # Mock privacy coin

docker-compose.yml           # Service orchestration
```

### Building Locally (Development)

```bash
# Install dependencies
cd frontend/demo
npm install

# Start dev server with hot reload
npm run dev
# Navigate to http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

### Modifying the Demo

#### Add a New Module
1. Create `frontend/demo/src/components/modules/NewModule.jsx`
2. Add button to `App.jsx`
3. Implement your component
4. Rebuild: `docker compose build civicverse-frontend`

#### Customize the City
1. Edit `frontend/demo/src/components/CityScene.jsx`
2. Modify building positions, colors, or sizes
3. Add new street lights, objects, or effects
4. Rebuild and restart

#### Adjust Colors/Theme
1. Edit `frontend/demo/src/styles.css`
2. Modify CSS variables and color values
3. All components inherit from global styles

---

## Deployment

### Local Deployment (Current)
```bash
docker compose up -d
# Accessible at http://localhost:3000
```

### Cloud Deployment (AWS/GCP/Azure)
```bash
# Push Docker images to registry
docker tag civicverse-civicverse-frontend:latest YOUR_REGISTRY/civicverse-frontend:latest
docker push YOUR_REGISTRY/civicverse-frontend:latest

# Deploy with Docker Compose or Kubernetes
docker compose -f docker-compose.yml up -d
```

### Production Checklist
- [ ] Set environment variables in `.env`
- [ ] Enable HTTPS/SSL certificate
- [ ] Configure rate limiting on API
- [ ] Set up monitoring and logging
- [ ] Increase resource limits for load
- [ ] Enable auto-scaling policies
- [ ] Test disaster recovery procedures

---

## API Endpoints

### Backend (Port 5000)

#### Health Check
```
GET /health
Response: { "status": "ok" }
```

#### Token Prices
```
GET /api/backend
Response: { "status": "connected" }
```

#### Kaspa Node
```
GET /api/kaspa
Response: { "network": "mainnet", "height": 12345 }
```

#### Privacy Coin Daemon
```
GET /api/monero
Response: { "status": "synced", "height": 67890 }
```

---

## Stopping and Cleanup

### Stop Services (Keep Data)
```bash
docker compose stop
# Services are paused, data persists
```

### Restart Services
```bash
docker compose start
```

### Stop and Remove Containers
```bash
docker compose down
# Containers removed, volumes preserved
```

### Full Cleanup (Delete Everything)
```bash
docker compose down -v
# Containers and volumes deleted
# Images remain for quick restart
```

### Remove Images
```bash
docker compose down -v --rmi all
# Removes containers, volumes, AND images
```

---

## Advanced Configuration

### Custom Docker Compose Settings

Edit `docker-compose.yml`:

```yaml
services:
  civicverse-frontend:
    environment:
      - VITE_API_URL=http://localhost:5000
      - NODE_ENV=production
    ports:
      - "3000:3000"
    mem_limit: 1g
    cpus: '2.0'
```

### Environment Variables

Create `.env` file:

```bash
# Frontend
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Civicverse

# Backend
PORT=5000
KASPA_RPC=http://localhost:16110
MONERO_RPC=http://localhost:18081

# Logging
LOG_LEVEL=info
```

### Custom Networking

```bash
# Create isolated network
docker network create civicverse-net

# Connect services
docker compose --project-name civicverse up -d
```

---

## Support & Resources

### Documentation
- **3D Engine**: Three.js (https://threejs.org)
- **React Framework**: React 18 (https://react.dev)
- **Build Tool**: Vite (https://vitejs.dev)
- **UI Framework**: @react-three/fiber (https://docs.pmnd.rs/react-three-fiber)

### Community
- GitHub Issues: Report bugs and request features
- GitHub Discussions: Share ideas and ask questions
- Email: budgetbandit765@gmail.com

### Changelog
- **v1.0.0** (Dec 2025) - Initial release with 14 modules, WASD controls, refined city

---

## License

Civicverse Demo © 2025. All rights reserved.

---

**Last Updated**: December 6, 2025
**Status**: Production Ready ✅
**Running at**: http://localhost:3000
