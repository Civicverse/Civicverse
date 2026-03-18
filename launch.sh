#!/bin/bash

# One-click launch script for Civicverse Metaverse Node

echo "Starting Civicverse Metaverse Node..."

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker daemon is not running. Please start Docker and try again."
    echo "On Linux, run: sudo systemctl start docker"
    exit 1
fi

# Build and start the services
docker compose up --build -d

echo "Civicverse Node is launching..."
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3003"
echo "Multiplayer: http://localhost:8080"
echo ""
echo "To stop: docker compose down"
echo "To view logs: docker compose logs -f"