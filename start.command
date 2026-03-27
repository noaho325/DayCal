#!/bin/bash
# DayCal — double-click this file to launch the app on Mac

cd "$(dirname "$0")"

echo ""
echo "  DayCal"
echo "  ──────────────────────────────"

# Check for Node.js
if ! command -v node &>/dev/null; then
  echo ""
  echo "  ✗ Node.js is not installed."
  echo "    Download it from https://nodejs.org (LTS version)"
  echo ""
  read -p "  Press Enter to exit..."
  exit 1
fi

# Copy env file if missing
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo "  ✓ Created .env.local"
fi

# Generate icons if missing
if [ ! -f "public/icon-192.png" ]; then
  echo "  Generating app icons..."
  node scripts/generate-icons.js
fi

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
  echo "  Installing dependencies (first run only, takes ~1 min)..."
  npm install --silent
  echo "  ✓ Dependencies installed"
fi

# Build if no production build exists
if [ ! -d ".next/static" ]; then
  echo "  Building app (first run only, takes ~30 sec)..."
  npm run build
  echo "  ✓ Build complete"
fi

echo ""
echo "  ✓ Starting DayCal at http://localhost:3000"
echo ""
echo "  To install as a desktop app:"
echo "  Open http://localhost:3000 in Chrome, then click the install"
echo "  icon (⊕) in the address bar → Install → appears in your Dock"
echo ""
echo "  Press Ctrl+C to stop the server."
echo "  ──────────────────────────────"
echo ""

# Open browser after a short delay
sleep 2 && open "http://localhost:3000" &

npm start
