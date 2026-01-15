#!/bin/bash
echo "Stopping any running processes using claude-code..."
# Kill any node processes that might be using the module
pkill -f "node.*claude-code" 2>/dev/null || true

echo "Removing claude-code directories..."
sudo rm -rf /Users/daniel.stuart/.nvm/versions/node/v24.12.0/lib/node_modules/@anthropic-ai

echo "Removing any claude binary..."
sudo rm -f /Users/daniel.stuart/.nvm/versions/node/v24.12.0/bin/claude

echo "Clearing npm cache..."
npm cache clean --force

echo "Checking if directories are really gone..."
ls -la /Users/daniel.stuart/.nvm/versions/node/v24.12.0/lib/node_modules/@anthropic-ai 2>/dev/null || echo "Good: directory is gone"
