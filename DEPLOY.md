# One-click Deploy (VPS)

Prerequisites:
- Docker (20+) and Docker Compose (v2) installed on the VPS
- Ports: 3000 (frontend), 4001 (gateway), 8080 (multiplayer) open in firewall

Quick deploy:

```bash
# From repo root
chmod +x deploy.sh
./deploy.sh
```

Notes:
- `deploy.sh` will copy `.env.example` to `.env` if missing and run `Setup.sh` to generate keys.
- Edit `.env` to set real Monero/Kaspa addresses and secrets before exposing to public.
- To view logs: `docker compose logs -f civicverse-frontend gateway multiplayer-server`

Troubleshooting:
- If headless capture fails on CI due to missing libs, install libnss3/libnspr4 and related packages.
- If vendor chunk is large, consider optimizing `frontend/demo/vite.config.js` manualChunks.
