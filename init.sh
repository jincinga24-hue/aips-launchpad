#!/bin/bash
set -e

echo "Setting up AIPS Launchpad dev environment..."

# No dependencies to install — single HTML file

# Start simple HTTP server
echo "Starting HTTP server on port 8080..."
lsof -ti:8080 2>/dev/null | xargs kill 2>/dev/null || true
sleep 0.5
cd "$(dirname "$0")"
python3 -m http.server 8080 &>/dev/null &
sleep 1

echo "Dev environment ready — open http://localhost:8080"
