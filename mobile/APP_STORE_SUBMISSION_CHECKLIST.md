# Haya Al-Salat — App Store Connect Submission Checklist

Use this checklist when submitting **Haya Al-Salat** to the App Store. It is tailored to:

| Identifier | Value |
|---|---|
| App name | **Haya Al-Salat** |
| Bundle ID | `app.hayaalsalat.companion` |
| Apple Team ID | `D47J65KQXJ` |
| App Store Connect App ID | `3b2ab217-8afd-4c24-b752-4dbd82d31ba7` |
| Public website | https://fresh-friendly-face.lovable.app |
| Privacy Policy URL | https://fresh-friendly-face.lovable.app/privacy |
| Terms of Service URL | https://fresh-friendly-face.lovable.app/terms |

---

## Phase 1 — Prepare the native build

Run these steps on a Mac with Xcode 15+ and an active Apple Developer account.

- [ ] **1.1 Install dependencies**

  ```bash
  cd <project-folder>
  bun install
  ```

- [ ] **1.2 Confirm bundle ID in `capacitor.config.ts`**

  Should already be:

  ```ts
  appId: "app.hayaalsalat.companion",
  appName: "Haya Al-Salat",
  ```

- [ ] **1.3 Run the iOS preflight check**

  ```bash
  bun run mobile:preflight
  ```

  Fix any reported issues before continuing.

- [ ] **1.4 Build and open the iOS project**

  ```bash
  bun run mobile:ios
  ```

  This runs build → prerender → `cap sync ios` → opens Xcode.

- [ ] **1.5 Generate/update icon and splash assets**

  ```bash
  bun run mobile:assets
  ```

  Or manually with `@capacitor/assets` if the source files in `public/` changed.

---

## Phase 2 — Configure Xcode for submission

Open the project in Xcode (`npx cap open ios` if it is not already open).

- [ ] **2.1 Select the `App` target → General tab**

  | Field | Value |
  |---|---|
  | Version | `1.0.0` |
  | Build | `1` (must increase for every new upload) |
  | Display Name | Haya Al-Salat |
  | Bundle Identifier | `app.hayaalsalat.companion` |

- [ ] **2.2 Select Signing & Capabilities tab**

  | Setting | Value |
  |---|---|
  | Team | `D47J65KQXJ` |
  | Bundle Identifier | `app.hayaalsalat.companion` |
  | Automatically manage signing | ✅ Enabled |
  | Provisioning Profile | Automatic |
  | Push Notifications | ✅ Added |
  | Background Modes | ✅ Audio, AirPlay, and Picture in Picture<br>✅ Background fetch<br>✅ Remote notifications |

- [ ] **2.3 Verify `Info.plist` entries**

  Open `ios/App/App/Info.plist` and confirm:

  - `NSLocationWhenInUseUsageDescription` is present.
  - `NSUserNotificationUsageDescription` is present.
  - `UIBackgroundModes` contains `audio`, `fetch`, `remote-notification`.
  - `ITSAppUsesNonExemptEncryption` is set to `<false/>`.

- [ ] **2.4 Clean build folder and archive**

  1. Choose **Product → Clean Build Folder** (`Shift+Cmd+K`).
  2. Select destination **Any iOS Device (arm64)**.
  3. Choose **Product → Archive**.

- [ ] **2.5 Validate the archive**

  In the Organizer window:

  1. Select the archive.
  2. Click **Validate App**.
  3. Choose **App Store Connect** → **Upload**.
  4. Resolve any validation errors.

- [ ] **2.6 Upload the archive**

  1. With the archive selected, click **Distribute App**.
  2. Choose **App Store Connect** → **Upload**.
  3. Keep default options (symbols on, bitcode off).
  4. Click **Upload** and wait for the success dialog.

---

## Phase 3 — Configure App Store Connect listing

Open [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **Haya Al-Salat** (App ID `3b2ab217-8afd-4c24-b752-4dbd82d31ba7`).

### App Information

- [ ] **3.1 Name, subtitle, and categories**

  | Field | Value |
  |---|---|
  | Name | Haya Al-Salat |
  | Subtitle | Peaceful Fajr companion |
  | Primary Category | Lifestyle |
  | Secondary Category | Reference or Health & Fitness |
  | Content Rights | Does not contain third-party content (or add recitation license details if required) |

- [ ] **3.2 Set bundle ID**

  Bundle ID must be: `app.hayaalsalat.companion`

- [ ] **3.3 Add required URLs**

  | Field | URL |
  |---|---|
  | Privacy Policy URL | `https://fresh-friendly-face.lovable.app/privacy` |
  | Terms of Service URL | `https://fresh-friendly-face.lovable.app/terms` |
  | Support URL (optional) | `https://fresh-friendly-face.lovable.app/about` |

### Pricing and Availability

- [ ] **3.4 Price** — set to **Free** (or your chosen price).
- [ ] **3.5 Availability** — select the countries/regions where the app should be sold.

### App Privacy

- [ ] **3.6 Complete App Privacy questionnaire**

  Use `mobile/APP_PRIVACY_MAPPING.md` to answer each category accurately.

  Summary for Haya Al-Salat:

  | Data type | Used for | Linked to identity | Tracking |
  |---|---|---|---|
  | Coarse Location | Prayer-time calculation | No | No |
  | User ID (if signed in) | Account/sync | Yes | No |
  | Push Token | Fajr reminders | No | No |
  | User Preferences | Settings storage | No | No |
  | Crash Data | Stability (only if enabled) | No | No |

  - **Required reason API declarations**: none (no file timestamp, disk space, or system boot time APIs).
  - **Third-party SDK privacy manifests**: Capacitor plugins include their own `PrivacyInfo.xcprivacy` files.

### Prepare for Submission

- [ ] **3.7 Add screenshots**

  Required sizes:

  - iPhone 6.7" (1290×2796)
  - iPhone 6.5" (1284×2778)
  - iPhone 5.5" (1242×2208)
  - iPad 12.9" (2048×2732) — optional if iPhone-only

  Use the assets in `/mnt/documents/app-store/` or capture fresh ones in the iOS Simulator.

- [ ] **3.8 Fill description, keywords, and support info**

  | Field | Source |
  |---|---|
  | Description | `mobile/APP_STORE.md` §8 |
  | Keywords | `mobile/RELEASE_NOTES.md` §Keywords |
  | Promotional Text | `mobile/RELEASE_NOTES.md` §Promotional text |
  | What's New | `mobile/RELEASE_NOTES.md` §Version 1.0.0 |

- [ ] **3.9 Add App Review Information**

  | Field | Value |
  |---|---|
  | Sign-in required? | No |
  | Demo account | None |
  | Notes | Paste the review note from `mobile/APP_STORE.md` §9 |
  | Contact info | Your email and phone |

---

## Phase 4 — Build and compliance

After the upload finishes processing (10–60 minutes):

- [ ] **4.1 Select the build**

  In App Store Connect → **App Store** tab → select version `1.0.0` → click **+** next to **Build** → choose the uploaded build.

- [ ] **4.2 Answer Export Compliance**

  - Does your app use encryption? → **Yes** (HTTPS/TLS only).
  - Is it exempt? → **Yes**, uses only exempt encryption (standard HTTPS).

- [ ] **4.3 Complete Age Rating**

  Select **4+** (no objectionable content).

- [ ] **4.4 Verify content rights**

  Select **No, it does not contain third-party content**, unless you are licensing the recitation from a third party and need to provide documentation.

---

## Phase 5 — Final review and submit

- [ ] **5.1 Review every tab for warnings**

  App Store Connect shows a red badge or message for any missing required field.

- [ ] **5.2 Confirm pricing and availability**

- [ ] **5.3 Click Submit for Review**

  Typical review time: 24–48 hours.

---

## Phase 6 — Post-approval

- [ ] **6.1 Release automatically or manually**

  Choose **Release this version automatically after approval** or manually release after you receive the approval email.

- [ ] **6.2 Announce the launch**

  Use the share messages in `src/components/ShareApp.tsx` or the English/Swedish/Arabic text in `mobile/RELEASE_NOTES.md`.

---

## Re-submission checklist (for version updates)

For every new release:

1. Bump **Build** in Xcode (and optionally **Version** if user-facing changes exist).
2. Update `mobile/RELEASE_NOTES.md` with the new "What's New" text.
3. Run `bun run mobile:preflight`.
4. Run `bun run mobile:ios`.
5. Archive, validate, and upload.
6. In App Store Connect, create a new version, paste the new release notes, select the new build, and submit.

---

## Quick-reference command cheat sheet

```bash
# One-time setup
bun install

# Before every archive
bun run mobile:preflight
bun run mobile:ios

# In Xcode
# 1. Set Version 1.0.0, Build 1, Team D47J65KQXJ, Bundle ID app.hayaalsalat.companion
# 2. Destination: Any iOS Device (arm64)
# 3. Product → Archive
# 4. Organizer → Validate App → Distribute App → App Store Connect → Upload
```

---

## Troubleshooting

| Problem | Quick fix |
|---|---|
| "No account for team D47J65KQXJ" | Xcode → Settings → Accounts → sign in with your Apple ID → Download Manual Profiles |
| "The bundle identifier is not available" | Register `app.hayaalsalat.companion` at developer.apple.com → Identifiers, or choose a new bundle ID and update `capacitor.config.ts` |
| "Missing 64-bit support" / architecture error | Select **Any iOS Device (arm64)** as destination before archiving |
| Push capability missing | + Capability → Push Notifications; also enable in Apple Developer → Identifiers → app.hayaalsalat.companion |
| Build not appearing in App Store Connect | Wait 30–60 minutes; check email for an ITMS rejection |
| App Privacy questionnaire rejected | Re-read `mobile/APP_PRIVACY_MAPPING.md` and ensure every collected data type is declared |

---

**Good luck with the submission — may your Fajr be blessed. 🌙**
