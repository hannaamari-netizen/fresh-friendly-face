#!/usr/bin/env bash
# One-shot publish: preflight → check store copy → archive → upload → next steps.
# Usage on your Mac:  bun run mobile:publish
set -euo pipefail

TEAM_ID="${APPLE_TEAM_ID:-D47J65KQXJ}"
BUNDLE_ID="${IOS_BUNDLE_ID:-app.hayaalsalat.companion}"
ASC_APP_ID="3b2ab217-8afd-4c24-b752-4dbd82d31ba7"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "❌ Publishing requires macOS with Xcode. Run this on your Mac."
  exit 1
fi

echo "═══ Haya Al-Salat — App Store publish ═══"
echo "  Team ID:   $TEAM_ID"
echo "  Bundle ID: $BUNDLE_ID"
echo ""

echo "▶ Step 1/4 — Preflight checks"
bash mobile/scripts/preflight-ios.sh

echo ""
echo "▶ Step 2/4 — Store copy character limits"
node mobile/scripts/check-store-copy.js

echo ""
echo "▶ Step 3/4 — Archive"
bash mobile/scripts/archive-ios.sh

echo ""
echo "▶ Step 4/4 — Export + validate + upload"
bash mobile/scripts/upload-ios.sh

cat <<EOF

════════════════════════════════════════════════════════════════
✅ Build uploaded to App Store Connect.

NEXT STEPS (App Store Connect → App ID ${ASC_APP_ID})

 1. Wait for processing (10–60 min). You'll get an email when the
    build appears under TestFlight.

 2. TestFlight → your build → answer Export Compliance:
      "Does your app use encryption?"        → Yes
      "Does it qualify for an exemption?"    → Yes (standard HTTPS/TLS)

 3. App Store tab → 1.0.0 Prepare for Submission. Paste from
    mobile/APP_STORE_CONNECT_COPY.md:
      • What's New / Description (English, Arabic, Swedish)
      • Promotional text, Subtitle, Keywords
      • Support / Marketing / Privacy Policy URLs

 4. Upload screenshots from /mnt/documents/app-store/
    (privacy-entry screenshots: /mnt/documents/app-store/privacy/)

 5. App Privacy → select exactly these five data types and answer
    "No" to tracking (details in mobile/APP_PRIVACY_MAPPING.md):
      Coarse Location · User ID · Device ID ·
      Product Interaction · Other User Content

 6. Age rating 4+, then attach the processed build to version 1.0.0.

 7. Submit for Review.

 Full checklist: mobile/APP_STORE_SUBMISSION_CHECKLIST.md
════════════════════════════════════════════════════════════════
EOF
