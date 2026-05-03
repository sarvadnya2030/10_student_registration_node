#!/bin/bash
DIR="$(dirname "$0")"
cd "$DIR"

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

PORT=${PORT:-3000}
echo "Starting Node server → http://localhost:$PORT"
echo "Press Ctrl+C to stop."
PORT=$PORT node server.js
