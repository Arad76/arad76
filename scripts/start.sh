#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "🛢  OilOracle — Starting up..."

# ── Backend ──────────────────────────────────────────────────────────
echo "📦  Setting up Python backend..."
cd "$ROOT/backend"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate

pip install -q -r requirements.txt

# Download TextBlob corpora (needed for sentiment)
python3 -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('averaged_perceptron_tagger', quiet=True)" 2>/dev/null || true

echo "🚀  Starting backend on http://localhost:8000 ..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# ── Frontend ─────────────────────────────────────────────────────────
echo "📦  Setting up frontend..."
cd "$ROOT/frontend"

if [ ! -d "node_modules" ]; then
  npm install --silent
fi

echo "🚀  Starting frontend on http://localhost:3000 ..."
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "✅  OilOracle is running!"
echo ""
echo "   📊 Dashboard:  http://localhost:3000"
echo "   🔌 API:        http://localhost:8000"
echo "   📡 WebSocket:  ws://localhost:8000/ws"
echo "   📖 API Docs:   http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
