#!/usr/bin/env bash
set -euo pipefail

# Start backend and frontend in parallel for local development
cd "$(dirname "$0")/.."

# Start backend
npm --prefix backend install
PORT=3004 npm --prefix backend start &
BACKEND_PID=$!

# Start frontend
npm --prefix frontend install
npm --prefix frontend run dev &
FRONTEND_PID=$!

echo "Started backend (pid $BACKEND_PID) and frontend (pid $FRONTEND_PID)."
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:3004/api/status"

wait $BACKEND_PID $FRONTEND_PID
