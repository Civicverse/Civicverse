#!/usr/bin/env bash
set -euo pipefail

# Quickstart: build images and start the local stack for ai governance
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Building and starting docker-compose stack..."
docker compose up --build -d

echo "Waiting for services to report healthy..."

# check evaluator health
for i in {1..30}; do
  if curl -sSf "http://localhost:4310/health" >/dev/null 2>&1; then
    echo "evaluator ok"
    break
  fi
  sleep 1
  [ "$i" -eq 30 ] && { echo "evaluator timeout"; exit 1; }
done

# check ui-proxy root
for i in {1..30}; do
  if curl -sSf "http://localhost:4320/" >/dev/null 2>&1; then
    echo "ui-proxy ok"
    break
  fi
  sleep 1
  [ "$i" -eq 30 ] && { echo "ui-proxy timeout"; exit 1; }
done

# check local-signer container running
SIG_CNT=$(docker compose ps -q ai-governance-local-signer || true)
if [ -n "$SIG_CNT" ]; then
  for i in {1..20}; do
    RUNNING=$(docker inspect -f '{{.State.Running}}' "$SIG_CNT" 2>/dev/null || echo false)
    if [ "$RUNNING" = "true" ]; then
      echo "local-signer running"
      break
    fi
    sleep 1
    [ "$i" -eq 20 ] && { echo "local-signer not running"; exit 1; }
  done
else
  echo "local-signer container not found"; exit 1
fi

echo "All services are up. Use ./services/ai-governance-eval/tools/generate_admin_token.js and then visit http://localhost:4320"
