# Haya Al-Salat — App Store Submission Guide

This document walks you through publishing **Haya Al-Salat** on the Apple App Store. The web app is wrapped as a native iOS app using [Capacitor](https://capacitorjs.com). You run these steps on a Mac with Xcode after exporting the project from Lovable.

> **Lovable cannot create the final `.ipa` or submit to App Store Connect for you.** Apple requires macOS + Xcode for iOS builds and a paid Apple Developer account for submission.

---

## Prerequisites

- Mac with macOS Sonoma or later
- Xcode 15 or later (from the Mac App Store)
- Apple Developer Program membership ($99/year)
- App Store Connect record created for the app

---

## 1. Export and open the project locally

After exporting the repo from Lovable:

```bash
cd haya-alsalat
bun install
```

The Capacitor packages are already declared in `package.json`, so they install automatically.

---

## 2. Set your final bundle identifier

Open `capacitor.config.ts` and replace the placeholder with the exact bundle ID you registered in App Store Connect:

```ts
appId: "app.hayaalsalat.companion",
```

Example alternatives:

- `com.hannaamari.hayaalsalat`
- `app.hayaalsalat.companion`

> The bundle ID cannot be changed after the first upload without creating a new app record.

---

## 3. Build the web bundle and add iOS native project

```bash
bun run build
npx cap add ios
```

Run this once. It creates the `ios/` directory with an Xcode project.

For every subsequent update:

```bash
bun run build && npx cap sync ios
```

---

## 4. Generate iOS icons and splash screens

Source assets are already in `public/`:

- `public/icon-1024.png` — iOS app icon master
- `public/splash-2048x2732.png` — iOS splash master

Run the asset generator:

```bash
bun add -d @capacitor/assets
mkdir -p assets

cp public/icon-1024.png assets/icon.png
cp public/splash-2048x2732.png assets/splash.png

npx @capacitor/assets generate \
  --iconBackgroundColor "#0b0a1a" \
  --splashBackgroundColor "#0b0a1a"
```

This writes every required size into `ios/App/App/Assets.xcassets`. Commit the generated files.

---

## 5. Configure Xcode project for App Store

Open the project in Xcode:

```bash
npx cap open ios
```

### 5.1 Signing & Capabilities

1. Select the `App` target.
2. Open the **Signing & Capabilities** tab.
3. Choose your **Team**.
4. Set the **Bundle Identifier** to match `capacitor.config.ts`.
5. Enable **Automatically manage signing**.

### 5.2 Info.plist — required entries

Add or verify these keys in `ios/App/App/Info.plist`:

```xml
<key>UILaunchStoryboardName</key>
<string>LaunchScreen</string>

<!-- Background audio for Adhan and Surat Al-Mu'minun -->
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
  <string>fetch</string>
  <string>remote-notification</string>
</array>

<!-- User-facing permission strings -->
<key>NSUserNotificationUsageDescription</key>
<string>Haya Al-Salat sends a gentle reminder before Fajr prayer.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Your location is used to calculate accurate local prayer times.</string>

<!-- Status bar appearance -->
<key>UIViewControllerBasedStatusBarAppearance</key>
<false/>
<key>UIStatusBarStyle</key>
<string>UIStatusBarStyleLightContent</string>
```

### 5.3 Versioning

In the Xcode project navigator, select the project, then the **App** target:

- **Version** (`CFBundleShortVersionString`) → e.g. `1.0.0`
- **Build** (`CFBundleVersion`) → must increase for every upload, e.g. `1`

Keep these in sync with the Android build if you ship both.

---

## 6. Test on a real device

Before archiving, run on a physical iPhone:

1. Connect your iPhone via USB.
2. Select it as the run destination in Xcode.
3. Press the **Run** button.

Verify:

- Splash screen shows the dark theme and crescent.
- Prayer times load for your location.
- Audio plays when you tap the Surat or Adhan controls.
- The "Tap to enable audio" prompt appears on first launch.

> iOS WebView blocks autoplay until the user interacts, which is why the app asks for a tap before auto-starting audio.

---

## 7. Archive and upload

1. In Xcode select **Any iOS Device** as the destination.
2. Choose **Product → Archive**.
3. When the archive completes, click **Distribute App**.
4. Choose **App Store Connect** → **Upload**.

Xcode validates and uploads the build. This can take 10–30 minutes.

---

## 8. Fill App Store Connect listing

In [App Store Connect](https://appstoreconnect.apple.com):

| Field | Suggested value |
|-------|-----------------|
| App name | Haya Al-Salat |
| Subtitle | Peaceful Fajr companion |
| Primary category | Lifestyle or Reference |
| Secondary category | Health & Fitness |
| Content rights | No third-party content (or add the recitation license if required) |
| Age rating | 4+ |

### Description (English)

```text
Haya Al-Salat is a peaceful Fajr companion that gently prepares Muslims to wake for dawn prayer. It displays local prayer times, plays the Adhan for each prayer, and begins the beautiful recitation of Surat Al-Mu’minun by Mukhtar Al-Hajj a few minutes before Fajr — so you rise with remembrance of Allah.

Customize your reminder message, choose how early the recitation begins, snooze it if you need a few more minutes, and save the recitation for offline listening.

Features:
• Accurate local prayer times based on your location
• Adhan for every prayer with adjustable volume
• Auto-recitation of Surat Al-Mu’minun before Fajr
• Custom reminder notifications
• Offline audio support
• Share the app with friends and family

Created with care by Inoxin HA.
```

### Keywords

```text
fajr, prayer times, islam, quran, adhan, muslim, dawn, reminder, surah, recitation
```

### Screenshots required

- iPhone 6.7" (1290×2796)
- iPhone 6.5" (1284×2778)
- iPhone 5.5" (1242×2208)
- iPad 12.9" (2048×2732)

Use the Xcode Simulator to capture clean screenshots in light/dark mode if needed.

---

## 9. App Review demo notes

Paste this into the **App Review Information → Notes** field:

```text
Haya Al-Salat plays Adhan and Quran recitation audio. Because iOS requires a user gesture before audio can autoplay inside a web view, the app shows a "Tap to enable audio" prompt on first launch. Please tap that prompt to hear the Adhan and Surat Al-Mu'minun samples.

The app requests location permission to calculate local prayer times via the Aladhan API.
```

---

## 10. Submit for review

1. Select the build you uploaded.
2. Complete the submission form (content rights, age rating, etc.).
3. Click **Submit for Review**.

Typical review time: 24–48 hours.

---

## Post-release updates

For every new release:

1. Bump `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` in Xcode.
2. Run `bun run build && npx cap sync ios`.
3. Archive and upload again.
4. Submit the new build in App Store Connect.

---

## Need help?

- [Capacitor iOS documentation](https://capacitorjs.com/docs/ios)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
