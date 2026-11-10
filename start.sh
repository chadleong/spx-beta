#!/usr/bin/env bash
set -e

# Start Flask backend
echo "Starting backend on port 5000..."
cd "$(dirname "$0")/backend"
py app.py &
BACKEND_PID=$!

# Start Vite dev server
echo "Starting frontend on port 3000..."
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://localhost:5000"
echo "  Frontend: http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT INT TERM
wait
