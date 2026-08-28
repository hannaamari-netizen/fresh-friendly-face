#!/usr/bin/env bash
# Preflight for `bun run mobile:ios`.
#
# Verifies:
#   - Running on macOS with Xcode command-line tools
#   - Capacitor bundle id matches expected value
#   - iOS project Team ID + Bundle Identifier are set correctly
#   - Signing style is Automatic
#   - Required capabilities present in Info.plist (Push, Background Modes)
#   - App Store Connect App ID is documented
#
# Exits non-zero on any failure so `bun run` short-circuits.

set -u

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

EXPECTED_TEAM_ID="D47J65KQXJ"
EXPECTED_BUNDLE_ID="app.hayaalsalat.companion"
EXPECTED_APP_ID="3b2ab217-8afd-4c24-b752-4dbd82d31ba7"

PBXPROJ="ios/App/App.xcodeproj/project.pbxproj"
INFO_PLIST="ios/App/App/Info.plist"
CAP_CONFIG="capacitor.config.ts"

RED=$'\033[31m'; GRN=$'\033[32m'; YLW=$'\033[33m'; DIM=$'\033[2m'; RST=$'\033[0m'
fails=0; warns=0

pass() { printf "  %s✓%s %s\n" "$GRN" "$RST" "$1"; }
fail() { printf "  %s✗%s %s\n" "$RED" "$RST" "$1"; fails=$((fails+1)); }
warn() { printf "  %s!%s %s\n" "$YLW" "$RST" "$1"; warns=$((warns+1)); }
head() { printf "\n%s%s%s\n" "$DIM" "$1" "$RST"; }

head "Host environment"
if [[ "$(uname -s)" == "Darwin" ]]; then
  pass "macOS detected ($(sw_vers -productVersion 2>/dev/null || echo unknown))"
else
  fail "Not running on macOS — iOS archives require Xcode on a Mac"
fi

if command -v xcodebuild >/dev/null 2>&1; then
  pass "xcodebuild found ($(xcodebuild -version 2>/dev/null | head -1))"
else
  fail "xcodebuild not found — install Xcode from the Mac App Store, then run: xcode-select --install"
fi

if command -v xcode-select >/dev/null 2>&1; then
  dev_dir="$(xcode-select -p 2>/dev/null || true)"
  if [[ -z "${dev_dir:-}" ]]; then
    fail "xcode-select has no active developer directory — run: sudo xcode-select -s /Applications/Xcode.app"
  elif [[ "$dev_dir" == *"/Xcode.app/Contents/Developer"* ]]; then
    pass "Active developer directory = $dev_dir"
  else
    fail "Active developer directory is '$dev_dir' (CommandLineTools only) — run: sudo xcode-select -s /Applications/Xcode.app"
  fi

  if [[ -d "/Applications/Xcode.app" ]]; then
    xc_ver="$(defaults read /Applications/Xcode.app/Contents/Info CFBundleShortVersionString 2>/dev/null || echo unknown)"
    pass "Xcode.app present (version $xc_ver)"
  else
    warn "/Applications/Xcode.app not found — Xcode may be installed elsewhere"
  fi
else
  fail "xcode-select not found — install Xcode command line tools: xcode-select --install"
fi

if command -v xcodebuild >/dev/null 2>&1; then
  if xcodebuild -checkFirstLaunchStatus >/dev/null 2>&1; then
    pass "Xcode first-launch setup complete"
  else
    fail "Xcode needs first-launch setup — run: sudo xcodebuild -runFirstLaunch && sudo xcodebuild -license accept"
  fi
fi

if command -v xcrun >/dev/null 2>&1; then
  pass "xcrun found"
else
  warn "xcrun not found — Xcode command-line tools may be missing"
fi


head "Capacitor config"
if [[ -f "$CAP_CONFIG" ]]; then
  if grep -q "appId: \"$EXPECTED_BUNDLE_ID\"" "$CAP_CONFIG"; then
    pass "capacitor.config.ts appId = $EXPECTED_BUNDLE_ID"
  else
    fail "capacitor.config.ts appId does not match $EXPECTED_BUNDLE_ID"
  fi
else
  fail "capacitor.config.ts missing"
fi

head "Xcode project ($PBXPROJ)"
if [[ ! -f "$PBXPROJ" ]]; then
  fail "iOS project not found — run: npx cap add ios"
else
  if grep -q "DEVELOPMENT_TEAM = $EXPECTED_TEAM_ID" "$PBXPROJ"; then
    pass "DEVELOPMENT_TEAM = $EXPECTED_TEAM_ID"
  else
    found_team=$(grep -m1 "DEVELOPMENT_TEAM = " "$PBXPROJ" | sed 's/.*DEVELOPMENT_TEAM = \([^;]*\);.*/\1/' | tr -d ' "')
    if [[ -z "${found_team:-}" ]]; then
      warn "DEVELOPMENT_TEAM not set — open Xcode → Signing & Capabilities → Team = $EXPECTED_TEAM_ID"
    else
      fail "DEVELOPMENT_TEAM is '$found_team', expected '$EXPECTED_TEAM_ID'"
    fi
  fi

  if grep -q "PRODUCT_BUNDLE_IDENTIFIER = $EXPECTED_BUNDLE_ID" "$PBXPROJ"; then
    pass "PRODUCT_BUNDLE_IDENTIFIER = $EXPECTED_BUNDLE_ID"
  else
    found_bid=$(grep -m1 "PRODUCT_BUNDLE_IDENTIFIER = " "$PBXPROJ" | sed 's/.*PRODUCT_BUNDLE_IDENTIFIER = \([^;]*\);.*/\1/' | tr -d ' "')
    fail "PRODUCT_BUNDLE_IDENTIFIER is '${found_bid:-unset}', expected '$EXPECTED_BUNDLE_ID'"
  fi

  if grep -q "CODE_SIGN_STYLE = Automatic" "$PBXPROJ"; then
    pass "CODE_SIGN_STYLE = Automatic"
  else
    warn "CODE_SIGN_STYLE is not Automatic — enable 'Automatically manage signing' in Xcode"
  fi

  if grep -q "MARKETING_VERSION = " "$PBXPROJ"; then
    mv=$(grep -m1 "MARKETING_VERSION = " "$PBXPROJ" | sed 's/.*MARKETING_VERSION = \([^;]*\);.*/\1/' | tr -d ' ')
    pass "MARKETING_VERSION = $mv"
  else
    warn "MARKETING_VERSION not set"
  fi

  if grep -q "CURRENT_PROJECT_VERSION = " "$PBXPROJ"; then
    cpv=$(grep -m1 "CURRENT_PROJECT_VERSION = " "$PBXPROJ" | sed 's/.*CURRENT_PROJECT_VERSION = \([^;]*\);.*/\1/' | tr -d ' ')
    pass "CURRENT_PROJECT_VERSION = $cpv (bump for every TestFlight upload)"
  else
    warn "CURRENT_PROJECT_VERSION not set"
  fi

  if grep -q "IPHONEOS_DEPLOYMENT_TARGET = " "$PBXPROJ"; then
    dt=$(grep -m1 "IPHONEOS_DEPLOYMENT_TARGET = " "$PBXPROJ" | sed 's/.*IPHONEOS_DEPLOYMENT_TARGET = \([^;]*\);.*/\1/' | tr -d ' ')
    if awk "BEGIN {exit !($dt >= 15.0)}" >/dev/null 2>&1; then
      pass "IPHONEOS_DEPLOYMENT_TARGET = $dt (>= 15.0)"
    else
      fail "IPHONEOS_DEPLOYMENT_TARGET = $dt; must be 15.0 or higher (ITMS-90068)"
    fi
  else
    warn "IPHONEOS_DEPLOYMENT_TARGET not set"
  fi
fi

head "Info.plist ($INFO_PLIST)"
if [[ ! -f "$INFO_PLIST" ]]; then
  fail "Info.plist missing"
else
  for k in NSLocationWhenInUseUsageDescription NSUserNotificationUsageDescription UIBackgroundModes ITSAppUsesNonExemptEncryption; do
    if grep -q "<key>$k</key>" "$INFO_PLIST"; then
      pass "$k present"
    else
      fail "$k missing from Info.plist"
    fi
  done

  for mode in audio fetch remote-notification; do
    if grep -q "<string>$mode</string>" "$INFO_PLIST"; then
      pass "UIBackgroundModes includes $mode"
    else
      warn "UIBackgroundModes missing '$mode' — required for background audio/reminders"
    fi
  done
fi

head "Signing account (best-effort)"
if command -v security >/dev/null 2>&1; then
  if security find-identity -v -p codesigning 2>/dev/null | grep -q "Apple Development\|Apple Distribution"; then
    pass "Apple signing identity found in Keychain"
  else
    warn "No Apple Development/Distribution certificate in Keychain — sign in Xcode → Settings → Accounts"
  fi
else
  warn "security(1) not available — cannot check Keychain"
fi

head "Reference IDs"
pass "Apple Team ID:            $EXPECTED_TEAM_ID"
pass "Bundle Identifier:        $EXPECTED_BUNDLE_ID"
pass "App Store Connect App ID: $EXPECTED_APP_ID"

echo
if (( fails > 0 )); then
  printf "%sPreflight failed: %d error(s), %d warning(s).%s\n" "$RED" "$fails" "$warns" "$RST"
  echo "Fix the errors above, then re-run: bun run mobile:preflight"
  exit 1
fi

if (( warns > 0 )); then
  printf "%sPreflight passed with %d warning(s).%s\n" "$YLW" "$warns" "$RST"
else
  printf "%sPreflight passed. Ready for: bun run mobile:ios%s\n" "$GRN" "$RST"
fi
exit 0
