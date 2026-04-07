#!/bin/bash

# Modular Microservices Launch Script for CivicVerse
# Supports 'dev' and 'prod' modes.

MODE=${1:-dev}
COMPOSE_FILE="docker-compose.modular.yml"

echo "🚀 Starting CivicVerse Modular Microservices in $MODE mode..."

if [ "$MODE" == "dev" ]; then
    npm install
    npm start
elif [ "$MODE" == "prod" ]; then
    docker-compose -f $COMPOSE_FILE up --build -d
    
    echo "✅ CivicVerse Production Infrastructure is launching..."
    echo ""
    echo "--- Active Endpoints ---"
    echo "Frontend Hub:      http://localhost:3000"
    echo "Onboarding Flow:   http://localhost:3001"
    echo "Vault (Wallet):    http://localhost:3008"
    echo "Identity (ID/Avatar): http://localhost:3009"
    echo "Watch Service:     http://localhost:3002"
    echo "Governance:        http://localhost:3004"
    echo "Mining Logic:      http://localhost:3005"
    echo "Marketplace:       http://localhost:3006"
    echo "Foyer Social:      http://localhost:3007"
    echo "Ollama AI:         http://localhost:11434"
    echo "------------------------"
    echo ""
    echo "To view all logs: docker-compose -f $COMPOSE_FILE logs -f"
else
    echo "Usage: ./launch.sh [dev|prod]"
    exit 1
fi
