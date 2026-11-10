#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Use the project virtualenv if present
if [ -f "$ROOT/.venv/bin/activate" ]; then
  # shellcheck disable=SC1091
  source "$ROOT/.venv/bin/activate"
fi

# Start Flask backend
echo "Starting backend on port 3000..."
(cd "$ROOT/backend" && exec python3 app.py) &
BACKEND_PID=$!

# Start Vite dev server
echo "Starting frontend on port 4000..."
(cd "$ROOT/frontend" && exec npm run dev) &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://localhost:3000"
echo "  Frontend: http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT INT TERM
wait
