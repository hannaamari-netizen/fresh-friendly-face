#!/usr/bin/env bash
set -euo pipefail

# Generate iOS and Android icons + splash screens from the PWA master assets.
# Run from the repo root after exporting from Lovable.

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

mkdir -p assets

echo "Copying master assets..."
cp public/icon-1024.png assets/icon.png
cp public/icon-maskable-512.png assets/icon-foreground.png

# Android adaptive icon background
if [ ! -f assets/icon-background.png ]; then
  echo "Creating Android adaptive icon background..."
  # If ImageMagick is available, generate a solid background PNG.
  if command -v convert >/dev/null 2>&1; then
    convert -size 1024x1024 "xc:#0b0a1a" assets/icon-background.png
  else
    echo "⚠️  ImageMagick not found. Create assets/icon-background.png as a 1024×1024 solid #0b0a1a PNG manually."
  fi
fi

# iOS / Android splash master
if [ ! -f assets/splash.png ]; then
  echo "Creating splash master from existing PWA splash..."
  cp public/splash/splash-2048x2732.png assets/splash.png
fi

echo "Generating platform assets with @capacitor/assets..."
npx @capacitor/assets generate \
  --iconBackgroundColor "#0b0a1a" \
  --splashBackgroundColor "#0b0a1a"

echo "Done. Native assets regenerated. Run 'npx cap sync' to apply them."
