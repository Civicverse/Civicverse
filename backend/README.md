# ⚙️ Civicverse Backend

## 🚀 Overview
The Civicverse backend acts as the central relay and state management system for the decentralized metaverse coordination layer. It handles real-time communication between users, coordinates P2P data flow, and provides APIs for the Civic Vault.

### 🎯 Key Functions
- **WebSocket Relay:** Real-time state synchronization for the Godot Foyer.
- **Identity Proxy:** Secure, non-custodial coordination for the CivicID vault.
- **Telemetry Aggregation:** Managing real-time data from community mining pools.
- **API Services:** REST endpoints for governance, marketplace, and social feeds.

---

## 🏗 Technology Stack
- **Runtime:** Node.js (v20+)
- **Framework:** Express.js
- **Real-time:** Socket.io
- **Scripting:** TypeScript (via `tsx`)
- **Containerization:** Docker (Alpine-based)

---

## 🛠 Getting Started

### Local Development
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the development server
npm start
```
The server will be available at `http://localhost:3003` by default.

---

## 📁 Directory Structure
- `index.js`: Main entry point and server configuration.
- `src/`: Core logic and service implementation.
- `Dockerfile`: Production-ready container definition.

---

## 🤝 Contribution
When contributing to the backend, focus on scalability and security. Ensure all WebSocket events are properly typed and all API endpoints are hardened against common vulnerabilities.
