#!/usr/bin/env bash
# Creates an Xcode archive for Haya Al-Salat using the configured signing settings.
# Run on macOS with Xcode installed:  bun run mobile:archive
set -euo pipefail

TEAM_ID="${APPLE_TEAM_ID:-D47J65KQXJ}"
BUNDLE_ID="${IOS_BUNDLE_ID:-app.hayaalsalat.companion}"
SCHEME="App"
WORKSPACE="ios/App/App.xcworkspace"
ARCHIVE_DIR="${ARCHIVE_DIR:-build/ios}"
STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE_PATH="${ARCHIVE_DIR}/HayaAlSalat-${STAMP}.xcarchive"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "❌ Archiving requires macOS with Xcode. Run this on your Mac."
  exit 1
fi

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "❌ xcodebuild not found. Install Xcode and run: sudo xcode-select -s /Applications/Xcode.app"
  exit 1
fi

if [[ ! -d "$WORKSPACE" ]]; then
  echo "❌ $WORKSPACE not found. Run: bun run mobile:ios (build + cap sync) first."
  exit 1
fi

echo "▶ Preflight checks"
bash mobile/scripts/preflight-ios.sh

echo "▶ Building web bundle and syncing Capacitor"
bun run build
bun run mobile:prerender
npx cap sync ios

mkdir -p "$ARCHIVE_DIR"

echo "▶ Archiving $SCHEME"
echo "  Team ID:   $TEAM_ID"
echo "  Bundle ID: $BUNDLE_ID"
echo "  Output:    $ARCHIVE_PATH"

xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
  CODE_SIGN_STYLE=Automatic \
  -allowProvisioningUpdates \
  archive

echo ""
echo "✅ Archive created: $ARCHIVE_PATH"
echo "▶ Opening Xcode Organizer — use Distribute App → App Store Connect → Upload"
open "$ARCHIVE_PATH" || xcodebuild -exportArchive -help >/dev/null 2>&1 || true
