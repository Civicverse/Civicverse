#!/bin/bash

echo "╔════════════════════════════════════════════╗"
echo "║   Civicverse Multiplayer Demo Status       ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check Frontend
echo "🔍 Checking Frontend (http://localhost:3000)..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ Frontend: RUNNING"
else
  echo "❌ Frontend: NOT RESPONDING"
fi

# Check Multiplayer Server
echo ""
echo "🔍 Checking Multiplayer Server (ws://localhost:8080)..."
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
  echo "✅ Multiplayer Server: RUNNING"
  PLAYERS=$(curl -s http://localhost:8080/api/players 2>/dev/null | grep -o '"count":[0-9]*' | cut -d: -f2)
  echo "   Players Connected: $PLAYERS"
else
  echo "❌ Multiplayer Server: NOT RESPONDING"
fi

# Check Docker Containers
echo ""
echo "🐳 Docker Containers:"
docker compose ps 2>/dev/null | grep -E "civicverse-frontend|multiplayer-server" | awk '{print "   " $1 ": " $6}'

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   HOW TO TEST MULTIPLAYER                  ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "1️⃣  Open http://localhost:3000"
echo "2️⃣  Open same URL in another browser/tab"
echo "3️⃣  Use WASD to move, SPACE to attack"
echo "4️⃣  Watch kill counter increment!"
echo ""
echo "📊 Live Monitoring:"
echo "   curl http://localhost:8080/api/players"
echo ""
