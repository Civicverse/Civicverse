Run locally (development)
=========================

Prerequisites
- Docker and Docker Compose installed (tested with Docker Engine and Compose v2+)
- Git and a working network connection to your remote repository

Quick start (single command)

1. From the repository root run (this rebuilds images and serves the frontend on http://localhost:3000):

```bash
cd /home/frybo/Civicverse
docker-compose down
docker-compose up -d --build
```

2. Open the demo in your browser: http://localhost:3000

Notes and useful commands
- To rebuild only the frontend locally (no compose):

```bash
cd frontend/demo
npm ci
npm run build
# serve dist with a simple static server (example):
npx http-server dist -p 3000
```

- Frontend port (when run via compose): 3000 -> container:80
- Multiplayer websocket port: 8080
- API gateway port: 4001

Troubleshooting
- If the page is blank, check browser console for errors and verify the `react-vendor` chunk is being served.
- To inspect container logs:

```bash
docker-compose logs -f civicverse-frontend
docker-compose logs -f gateway
```

Committing and pushing changes
- After validating locally, commit any local changes and push to your remote:

```bash
git add -A
git commit -m "chore: rebuild frontend chunking; add run instructions"
git push origin HEAD
```

If `git push` fails because of credentials or branch protection, push from your machine with the correct remote permissions or open a PR from a feature branch.
