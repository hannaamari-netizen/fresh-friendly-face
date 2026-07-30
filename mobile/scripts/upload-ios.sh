#!/usr/bin/env bash
# Exports the latest Xcode archive to an .ipa and uploads it to App Store Connect
# using an App Store Connect API key (no Xcode UI, no Apple ID password).
#
# Usage on your Mac:
#   bun run mobile:archive      # creates build/ios/HayaAlSalat-<stamp>.xcarchive
#   bun run mobile:upload       # exports + uploads it
#
# Required environment variables:
#   ASC_KEY_ID      App Store Connect API Key ID      (e.g. ABC123DEF4)
#   ASC_ISSUER_ID   App Store Connect Issuer ID       (UUID)
#   ASC_KEY_PATH    Path to the AuthKey_<KEY_ID>.p8   (optional if the key is in
#                   ~/.appstoreconnect/private_keys/ or ./private_keys/)
#
# Create the key at: App Store Connect → Users and Access → Integrations →
# App Store Connect API → generate a key with the "App Manager" role.
# The .p8 downloads once — keep it outside the repo.
set -euo pipefail

TEAM_ID="${APPLE_TEAM_ID:-D47J65KQXJ}"
BUNDLE_ID="${IOS_BUNDLE_ID:-app.hayaalsalat.companion}"
ARCHIVE_DIR="${ARCHIVE_DIR:-build/ios}"
EXPORT_DIR="${EXPORT_DIR:-build/ios/export}"
EXPORT_PLIST="mobile/ExportOptions.plist"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "❌ Uploading requires macOS with Xcode command line tools. Run this on your Mac."
  exit 1
fi

command -v xcodebuild >/dev/null 2>&1 || { echo "❌ xcodebuild not found. Install Xcode."; exit 1; }

# --- Locate the archive -----------------------------------------------------
ARCHIVE_PATH="${1:-}"
if [[ -z "$ARCHIVE_PATH" ]]; then
  ARCHIVE_PATH="$(ls -td "${ARCHIVE_DIR}"/*.xcarchive 2>/dev/null | head -n 1 || true)"
fi
if [[ -z "$ARCHIVE_PATH" || ! -d "$ARCHIVE_PATH" ]]; then
  echo "❌ No .xcarchive found in ${ARCHIVE_DIR}."
  echo "   Run: bun run mobile:archive    (or pass a path: bun run mobile:upload -- /path/to/App.xcarchive)"
  exit 1
fi

# --- Credentials ------------------------------------------------------------
missing=0
for var in ASC_KEY_ID ASC_ISSUER_ID; do
  if [[ -z "${!var:-}" ]]; then
    echo "❌ Missing environment variable: $var"
    missing=1
  fi
done
if [[ $missing -eq 1 ]]; then
  cat <<'EOF'

Set them in your shell (add to ~/.zshrc to persist):

  export ASC_KEY_ID="ABC123DEF4"
  export ASC_ISSUER_ID="00000000-0000-0000-0000-000000000000"
  export ASC_KEY_PATH="$HOME/.appstoreconnect/private_keys/AuthKey_ABC123DEF4.p8"

Generate the key: App Store Connect → Users and Access → Integrations →
App Store Connect API → "+" → Access: App Manager → download the .p8 once.
EOF
  exit 1
fi

KEY_PATH="${ASC_KEY_PATH:-$HOME/.appstoreconnect/private_keys/AuthKey_${ASC_KEY_ID}.p8}"
if [[ ! -f "$KEY_PATH" ]]; then
  echo "❌ API key file not found: $KEY_PATH"
  echo "   Set ASC_KEY_PATH to the AuthKey_${ASC_KEY_ID}.p8 file."
  exit 1
fi

# altool/xcodebuild look up keys by ID in these directories.
PRIVATE_KEYS_DIR="$HOME/.appstoreconnect/private_keys"
mkdir -p "$PRIVATE_KEYS_DIR"
if [[ ! -f "${PRIVATE_KEYS_DIR}/AuthKey_${ASC_KEY_ID}.p8" ]]; then
  cp "$KEY_PATH" "${PRIVATE_KEYS_DIR}/AuthKey_${ASC_KEY_ID}.p8"
  chmod 600 "${PRIVATE_KEYS_DIR}/AuthKey_${ASC_KEY_ID}.p8"
fi

# --- Export the .ipa --------------------------------------------------------
echo "▶ Exporting archive"
echo "  Archive:   $ARCHIVE_PATH"
echo "  Team ID:   $TEAM_ID"
echo "  Bundle ID: $BUNDLE_ID"

rm -rf "$EXPORT_DIR"
mkdir -p "$EXPORT_DIR"

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_PLIST" \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$KEY_PATH" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID"

IPA_PATH="$(ls "${EXPORT_DIR}"/*.ipa 2>/dev/null | head -n 1 || true)"
if [[ -z "$IPA_PATH" ]]; then
  echo "❌ Export finished but no .ipa was produced in ${EXPORT_DIR}."
  exit 1
fi
echo "✅ Exported: $IPA_PATH"

# --- Validate then upload ---------------------------------------------------
echo "▶ Validating with App Store Connect"
xcrun altool --validate-app \
  -f "$IPA_PATH" \
  -t ios \
  --apiKey "$ASC_KEY_ID" \
  --apiIssuer "$ASC_ISSUER_ID"

echo "▶ Uploading to App Store Connect"
xcrun altool --upload-app \
  -f "$IPA_PATH" \
  -t ios \
  --apiKey "$ASC_KEY_ID" \
  --apiIssuer "$ASC_ISSUER_ID"

cat <<EOF

✅ Upload complete.

Next:
  1. Wait 10–60 min for processing (you'll get an email).
  2. App Store Connect → App ID 3b2ab217-8afd-4c24-b752-4dbd82d31ba7 → TestFlight
     → answer Export Compliance (standard HTTPS → exempt).
  3. Paste listing copy from mobile/APP_STORE_CONNECT_COPY.md
     (verify limits first: bun run mobile:check-copy).
  4. Submit for Review.
EOF
