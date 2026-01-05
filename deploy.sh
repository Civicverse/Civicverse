#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT"

# Ensure .env exists
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo "Creating .env from .env.example"
    cp .env.example .env
  else
    echo ".env.example not found; please create .env with required values" >&2
    exit 1
  fi
fi

# Run project setup (generates keys if necessary)
if [ -f ./Setup.sh ]; then
  echo "Running Setup.sh to generate keys and defaults"
  bash ./Setup.sh
fi

# Build frontend and backend with docker-compose
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. Install Docker and docker-compose before continuing." >&2
  exit 1
fi

echo "Building and starting services via docker-compose..."
COMPOSE_FILE="docker-compose.yml"
# pull/build images and start
docker compose -f "$COMPOSE_FILE" build --pull --parallel
docker compose -f "$COMPOSE_FILE" up -d

echo "Waiting for key services to become healthy..."
# simple wait loop for gateway and frontend
for i in {1..30}; do
  sleep 2
  if curl -sSf http://localhost:4001/health >/dev/null 2>&1; then
    echo "Gateway is up"
    break
  fi
  echo -n "."
done

echo
echo "Deployment complete. Frontend (nginx) should be available on port 3000 and Gateway on 4001."
