// Runtime app lifecycle state — surfaces foreground/background transitions so
// support can reproduce issues that depend on whether the app was active.
// - Native (Capacitor): @capacitor/app appStateChange events (source of truth).
// - Web/PWA: document visibility + window focus/blur.
import { useEffect, useState } from "react";

export type LifecycleState = {
  appState: "active" | "background";
  visibility: "visible" | "hidden" | "prerender" | "unknown";
  focused: boolean;
  lastForegroundAt: string | null;
  lastBackgroundAt: string | null;
  source: "native" | "web";
};

function readWebState(): Pick<LifecycleState, "appState" | "visibility" | "focused"> {
  if (typeof document === "undefined") {
    return { appState: "active", visibility: "unknown", focused: true };
  }
  const vis = document.visibilityState as LifecycleState["visibility"];
  const focused = typeof document.hasFocus === "function" ? document.hasFocus() : true;
  return {
    appState: vis === "visible" ? "active" : "background",
    visibility: vis,
    focused,
  };
}

export function useLifecycleState(): LifecycleState {
  // Always initialize with SSR-safe values; real device state is applied in
  // useEffect below so server-rendered HTML matches the first client render.
  const [state, setState] = useState<LifecycleState>({
    appState: "active",
    visibility: "unknown",
    focused: true,
    lastForegroundAt: null,
    lastBackgroundAt: null,
    source: "web",
  });

  useEffect(() => {
    let cancelled = false;
    let nativeCleanup: (() => void) | null = null;

    const applyWeb = () => {
      if (cancelled) return;
      const next = readWebState();
      setState((prev) => ({
        ...prev,
        ...next,
        lastForegroundAt:
          next.appState === "active" && prev.appState !== "active"
            ? new Date().toISOString()
            : prev.lastForegroundAt,
        lastBackgroundAt:
          next.appState === "background" && prev.appState !== "background"
            ? new Date().toISOString()
            : prev.lastBackgroundAt,
      }));
    };

    const onVisibility = () => applyWeb();
    const onFocus = () => applyWeb();
    const onBlur = () => applyWeb();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    // Native listener (overrides source & appState with binary truth from OS)
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (cancelled) return;
          setState((prev) => ({
            ...prev,
            source: "native",
            appState: isActive ? "active" : "background",
            lastForegroundAt: isActive ? new Date().toISOString() : prev.lastForegroundAt,
            lastBackgroundAt: !isActive ? new Date().toISOString() : prev.lastBackgroundAt,
          }));
        });
        if (cancelled) {
          await handle.remove();
          return;
        }
        setState((prev) => ({ ...prev, source: "native" }));
        nativeCleanup = () => {
          handle.remove().catch(() => {});
        };
      } catch {
        /* stay on web source */
      }
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      if (nativeCleanup) nativeCleanup();
    };
  }, []);

  return state;
}
