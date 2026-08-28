# Haya Al-Salat — iOS & Android release builds

This project is a TanStack Start web app. To ship to the App Store and Google
Play, wrap it with **Capacitor** locally after exporting the repo from Lovable.
Lovable itself cannot build `.ipa` / `.aab` artifacts — those require Xcode
(macOS) and Android Studio.

The `capacitor.config.ts` at the repo root already holds the shared release
settings. Everything below is what you do **after** cloning the exported repo.

---

## 1. One-time local setup

```bash
# from repo root
bun install
bun add -d @capacitor/cli
bun add @capacitor/core @capacitor/ios @capacitor/android @capacitor/splash-screen
```

Build the static web bundle Capacitor will embed:

```bash
bun run build            # emits dist/client (matches webDir in capacitor.config.ts)
```

Add the native projects (run once):

```bash
npx cap add ios
npx cap add android
```

---

## 2. Identity — edit before the first `cap sync`

Open `capacitor.config.ts` and set:

| Field     | Example                        | Notes                                                   |
| --------- | ------------------------------ | ------------------------------------------------------- |
| `appId`   | `app.hayaalsalat.companion`    | Reverse-DNS. Must match App Store Connect + Play Console. |
| `appName` | `Haya Al-Salat`                | Home-screen label. Keep ≤ 12 chars for iOS truncation.  |

Then sync into the native projects:

```bash
bun run build && npx cap sync
```

---

## 3. Versioning (per store)

Capacitor does not centralize versioning — each store reads its own file. Keep
`versionName` / `CFBundleShortVersionString` in sync manually.

### iOS — `ios/App/App.xcodeproj` (or `Info.plist`)

| Key                          | Meaning                     | Example |
| ---------------------------- | --------------------------- | ------- |
| `MARKETING_VERSION`          | User-visible version        | `1.2`   |
| `CURRENT_PROJECT_VERSION`    | Build number (must ↑ each upload) | `8`     |

### Android — `android/app/build.gradle`

```gradle
defaultConfig {
    applicationId "app.hayaalsalat.companion"   // mirror appId
    versionCode 8                                // integer, must ↑ each upload
    versionName "1.2"                            // user-visible
    minSdkVersion 23
    targetSdkVersion 34
}
```

---

## 4. Icons & splash

Source assets are already in `public/`:

- `public/icon-1024.png` — master icon (1024×1024, no transparency, no rounded corners)
- `public/icon-maskable-512.png` — full-bleed master for Android adaptive icons
- `public/splash/` — existing PWA splash images

Use **`@capacitor/assets`** to generate every platform-specific size from one
source file:

```bash
bun add -d @capacitor/assets
mkdir -p assets
cp public/icon-1024.png assets/icon.png                    # foreground / iOS icon
cp public/icon-maskable-512.png assets/icon-foreground.png # Android adaptive fg
# create assets/icon-background.png as a solid #0b0a1a 1024×1024 PNG
# create assets/splash.png (2732×2732, logo centered on #0b0a1a)
npx @capacitor/assets generate --iconBackgroundColor "#0b0a1a" \
                               --splashBackgroundColor "#0b0a1a"
```

This writes into `ios/App/App/Assets.xcassets` and
`android/app/src/main/res/mipmap-*` — commit the output.

---

## 5. Store-ready release builds

### iOS (macOS + Xcode required)

```bash
bun run build && npx cap sync ios
npx cap open ios
```

In Xcode: select **Any iOS Device** → Product → Archive → Distribute App →
App Store Connect.

Signing: set your **Team** under Signing & Capabilities. Bump
`CURRENT_PROJECT_VERSION` for every upload.

### Android

```bash
bun run build && npx cap sync android
npx cap open android
```

In Android Studio: Build → **Generate Signed Bundle / APK** → **Android App
Bundle (.aab)**. Create/reuse a keystore and store it outside the repo. Bump
`versionCode` for every upload.

---

## 6. Store submission checklist

- [ ] Final `appId` set in `capacitor.config.ts` and mirrored in `applicationId`
- [ ] `MARKETING_VERSION` = `versionName` (e.g. `1.2`)
- [ ] `CURRENT_PROJECT_VERSION` and `versionCode` incremented since last upload
- [ ] Icons regenerated via `@capacitor/assets`
- [ ] Privacy policy URL live (both stores require it)
- [ ] Screenshots: iPhone 6.7"/6.5"/5.5" + iPad 12.9" (iOS), phone + 7"/10" tablet (Android)
- [ ] Age rating questionnaire completed
- [ ] Apple: demo notes explaining Fajr auto-recitation for the reviewer

## 7. App Store specifics

See [`APP_STORE.md`](./APP_STORE.md) for the complete iOS upload workflow, Xcode configuration, Info.plist entries, review demo notes, and suggested store listing text.
