#!/bin/bash
set -e

echo "🚀 Civicverse One-Click Setup"
echo "Generating keys and .env..."

# Generate fresh keys if not exist
if [ ! -f .env ]; then
  cp .env.example .env

  # Generate random ed25519 + secp256k1 keys (you can replace with real ones later)
  PRIVATE_KEY=$(openssl rand -hex 32)
  sed -i "s|PRIVATE_KEY=.*|PRIVATE_KEY=0x$PRIVATE_KEY|g" .env

  echo "Generated new PRIVATE_KEY"
fi

echo "Pulling submodules..."
git submodule update --init --recursive

echo "Building Docker images..."
docker compose build --no-cache

echo ""
echo "✅ Setup complete!"
echo "Next: edit .env with your real wallet addresses"
echo "Then run: docker compose up -d"
echo "Your node will be live at https://$(hostname -I | awk '{print $1}')"
