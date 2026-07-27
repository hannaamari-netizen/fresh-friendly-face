// Runtime app-info source. Prefers native (Capacitor) values so the About screen
// always matches what Xcode / Gradle actually shipped; falls back to build-time
// constants injected by Vite (see vite.config.ts) for the web/PWA.
import { useEffect, useState } from "react";

declare const __APP_VERSION__: string;
declare const __APP_BUILD__: string;
declare const __APP_BUILD_DATE__: string;

export const BUILD_TIME_VERSION =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";
export const BUILD_TIME_BUILD =
  typeof __APP_BUILD__ !== "undefined" ? __APP_BUILD__ : "1";
export const BUILD_TIME_DATE =
  typeof __APP_BUILD_DATE__ !== "undefined"
    ? __APP_BUILD_DATE__
    : new Date().toISOString();

export const DEFAULT_BUNDLE_ID = "app.hayaalsalat.companion";

export type AppInfo = {
  name: string;
  version: string;
  build: string;
  bundleId: string;
  buildDate: string;
  source: "native" | "web";
};

const WEB_DEFAULT: AppInfo = {
  name: "Haya Al-Salat",
  version: BUILD_TIME_VERSION,
  build: BUILD_TIME_BUILD,
  bundleId: DEFAULT_BUNDLE_ID,
  buildDate: BUILD_TIME_DATE.slice(0, 10),
  source: "web",
};

/**
 * Reads app metadata at runtime.
 * - Native (iOS/Android via Capacitor): pulls the real values baked into the
 *   installed binary (Info.plist / build.gradle).
 * - Web/PWA: uses the values injected at Vite build time from package.json
 *   (or VITE_APP_VERSION / VITE_APP_BUILD env vars in CI).
 */
export function useAppInfo(): AppInfo {
  const [info, setInfo] = useState<AppInfo>(WEB_DEFAULT);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { App } = await import("@capacitor/app");
        const native = await App.getInfo();
        if (cancelled) return;
        setInfo({
          name: native.name || WEB_DEFAULT.name,
          version: native.version || WEB_DEFAULT.version,
          build: native.build || WEB_DEFAULT.build,
          bundleId: native.id || WEB_DEFAULT.bundleId,
          buildDate: WEB_DEFAULT.buildDate,
          source: "native",
        });
      } catch {
        /* stay on web defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}
