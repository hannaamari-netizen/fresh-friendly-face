#!/usr/bin/env bash
set -euo pipefail

# Build the web bundle and sync the iOS native project.
# Run from the repo root.

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "Building production web bundle..."
bun run build

echo "Syncing Capacitor iOS project..."
npx cap sync ios

echo "Opening Xcode..."
npx cap open ios
