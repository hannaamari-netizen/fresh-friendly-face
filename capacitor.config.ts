import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config for Haya Al-Salat native store builds.
 *
 * Store-ready fields — edit before running `npx cap sync`:
 *   - appId:   reverse-DNS bundle identifier (must match App Store Connect / Play Console)
 *   - appName: display name shown under the home-screen icon
 *   - ios.scheme / android package: derived from appId by default
 *
 * Versioning lives in the native projects (single source of truth per store):
 *   iOS      → ios/App/App/Info.plist         → CFBundleShortVersionString + CFBundleVersion
 *              or ios/App/App.xcodeproj → MARKETING_VERSION + CURRENT_PROJECT_VERSION
 *   Android  → android/app/build.gradle       → versionName + versionCode
 *
 * `webDir` points at the built SPA. TanStack Start's default build is SSR; run the
 * static build (`bun run build`) that emits `dist/client` before `npx cap sync`.
 * If your build output differs, update `webDir` to match.
 */
const config: CapacitorConfig = {
  appId: "app.hayaalsalat.companion", // TODO: replace with your final reverse-DNS bundle id
  appName: "Haya Al-Salat",
  webDir: "dist/client",
  backgroundColor: "#0b0a1a",

  ios: {
    scheme: "Haya Al-Salat",
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: true,
    backgroundColor: "#0b0a1a",
  },

  android: {
    allowMixedContent: false,
    backgroundColor: "#0b0a1a",
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0b0a1a",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashImmersive: true,
    },
  },
};

export default config;
