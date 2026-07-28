# TestFlight — First Build Upload

Archive and upload the first Haya Al-Salat build to TestFlight before the full App Store release.

> All steps run on a Mac with Xcode 15+ and a paid Apple Developer account.

---

## 0. Prerequisites (one-time)

- Paid Apple Developer Program membership (active).
- App Store Connect app record created:
  - **Name:** Haya Al-Salat
  - **Bundle ID:** `app.hayaalsalat.companion` (must match `capacitor.config.ts`)
  - **SKU:** any unique string (e.g. `haya-al-salat-001`)
  - **Primary language:** English
- Xcode signed in with your Apple ID: Xcode → Settings → Accounts.

---

## 1. Sync the latest web build into iOS

From the project root on your Mac:

```bash
bun install
bun run build
node mobile/scripts/prerender.js
npx cap sync ios
npx cap open ios
```

This copies the compiled web assets into `ios/App/App/public` and opens Xcode.

---

## 2. Set version and build number

In Xcode, select the **App** target → **General** tab:

| Field | Value |
|---|---|
| Version (CFBundleShortVersionString) | `1.0.0` |
| Build (CFBundleVersion) | `1` |

Every re-upload to TestFlight must increase the **Build** number (1 → 2 → 3…). The **Version** only changes when you ship a new release version.

---

## 3. Confirm Signing & Capabilities

Target **App** → **Signing & Capabilities**:

- Team: your paid Developer Team
- Bundle Identifier: `app.hayaalsalat.companion`
- Automatically manage signing: ✅
- Capabilities present:
  - Push Notifications
  - Background Modes → Audio, AirPlay, and Picture in Picture · Background fetch · Remote notifications

If Xcode shows a red "Failed to register bundle identifier" error, register it once at developer.apple.com → Identifiers, then retry.

---

## 4. Select the Archive destination

In the Xcode toolbar next to the scheme, choose:

**Any iOS Device (arm64)**

Archiving is disabled while a simulator is selected.

---

## 5. Create the Archive

Menu: **Product → Archive**

Wait for the build to finish (2–5 minutes). The **Organizer** window opens automatically with the new archive listed under the **Archives** tab.

If Archive is greyed out, re-check step 4.

---

## 6. Validate the Archive (recommended)

In the Organizer:

1. Select the new archive.
2. Click **Validate App**.
3. Distribution method: **App Store Connect**.
4. Destination: **Upload**.
5. Signing: **Automatically manage signing**.
6. Review warnings, then **Validate**.

Fix any errors before uploading. Common ones:
- Missing usage descriptions → already added in `ios/App/App/Info.plist`.
- Missing icon sizes → run `npx cap sync ios` again after regenerating icons.

---

## 7. Upload to App Store Connect

Still in Organizer with the archive selected:

1. Click **Distribute App**.
2. Method: **App Store Connect** → **Upload**.
3. Options: keep defaults (Include bitcode is now off by default, symbols on).
4. Signing: **Automatically manage signing**.
5. Click **Upload**.

Upload takes 3–10 minutes. Wait for the "Upload Successful" dialog before closing.

---

## 8. Wait for processing

- Go to https://appstoreconnect.apple.com → **My Apps** → **Haya Al-Salat** → **TestFlight** tab.
- The new build appears with status **Processing** (10–60 minutes).
- You'll receive an email when processing completes.

---

## 9. Complete TestFlight compliance

Once processing finishes, Apple flags one required item:

- **Export Compliance**: does your app use encryption?
  - Answer: **Yes** (HTTPS/TLS only, no custom crypto).
  - Then: **Yes**, uses only exempt encryption (standard HTTPS).
  - This clears the build for testing.

Optional but recommended before inviting testers:

- **Test Information** (TestFlight tab → left sidebar):
  - Beta App Description: "Peaceful Fajr companion that gently prepares Muslims to wake for Fajr through Surat Al-Mu'minun recited by Mukhtar Al Hajj."
  - Feedback email: your address
  - Marketing URL: https://fresh-friendly-face.lovable.app
  - Privacy Policy URL: https://fresh-friendly-face.lovable.app/privacy

---

## 10. Add internal testers (fastest path)

TestFlight tab → **Internal Testing** → **+** → create a group → add App Store Connect users (up to 100). They receive an email invite and use the **TestFlight** app on iPhone to install.

Internal testers get the build immediately, no Beta App Review required.

For **external testers** (up to 10,000), the first build must pass a short **Beta App Review** (usually < 24h).

---

## Re-uploading a new build

1. Bump the **Build** number in Xcode (e.g. 1 → 2).
2. `bun run build && node mobile/scripts/prerender.js && npx cap sync ios`
3. Product → Archive → Distribute App → Upload.

---

## Troubleshooting quick reference

| Symptom | Fix |
|---|---|
| Archive greyed out | Select "Any iOS Device (arm64)" as destination |
| "No account for team" | Xcode → Settings → Accounts → add Apple ID → Download Manual Profiles |
| "The bundle identifier is not available" | It's already taken by another app; change it (and update `capacitor.config.ts` + App Store Connect record) |
| Push Notifications capability missing | + Capability → Push Notifications; also enable in Apple Developer → Identifiers |
| Upload succeeds but no build shows up | Wait 30 min; check email for a rejection from Apple with the exact ITMS error |
| Build stuck in "Processing" > 24h | Contact Apple Developer Support; usually resolves itself |

---

**Ready to invite friends:** once the build is Ready to Test in TestFlight, share the public TestFlight link from the External Testing group. They install the TestFlight app once, tap your link, and Haya Al-Salat installs like a real App Store app.
