import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "haya.autoDownload.v1";

export type AutoDownloadSettings = {
  enabled: boolean;
  requireWifi: boolean;
  requireCharging: boolean;
};

const DEFAULTS: AutoDownloadSettings = {
  enabled: false,
  requireWifi: true,
  requireCharging: true,
};

function loadSettings(): AutoDownloadSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

type NetworkStatus = {
  online: boolean;
  wifi: boolean | null; // null = unknown
  charging: boolean | null;
  connectionType: string | null;
};

function readNetworkStatus(): NetworkStatus {
  if (typeof navigator === "undefined") {
    return { online: true, wifi: null, charging: null, connectionType: null };
  }
  // @ts-expect-error - connection API is non-standard
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const type: string | null = conn?.type ?? null;
  let wifi: boolean | null = null;
  if (type) {
    wifi = type === "wifi" || type === "ethernet";
  }
  return {
    online: navigator.onLine,
    wifi,
    charging: null, // set async via battery API
    connectionType: type,
  };
}

export function useAutoDownload(opts: {
  isCached: boolean;
  isDownloading: boolean;
  triggerDownload: () => void | Promise<void>;
}) {
  const [settings, setSettingsState] = useState<AutoDownloadSettings>(() => loadSettings());
  const [net, setNet] = useState<NetworkStatus>(() => readNetworkStatus());

  const setSettings = useCallback((patch: Partial<AutoDownloadSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Watch online / connection changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refresh = () => setNet((prev) => ({ ...prev, ...readNetworkStatus(), charging: prev.charging }));
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    // @ts-expect-error non-standard
    const conn = navigator.connection;
    conn?.addEventListener?.("change", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      conn?.removeEventListener?.("change", refresh);
    };
  }, []);

  // Battery API — subscribe once
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    // @ts-expect-error non-standard
    const getBattery: undefined | (() => Promise<any>) = navigator.getBattery?.bind(navigator);
    if (!getBattery) {
      setNet((p) => ({ ...p, charging: null }));
      return;
    }
    let battery: any;
    let cancelled = false;
    const onChange = () => {
      if (battery) setNet((p) => ({ ...p, charging: !!battery.charging }));
    };
    getBattery().then((b) => {
      if (cancelled) return;
      battery = b;
      onChange();
      battery.addEventListener("chargingchange", onChange);
    });
    return () => {
      cancelled = true;
      battery?.removeEventListener?.("chargingchange", onChange);
    };
  }, []);

  // Auto-trigger download when conditions are met
  useEffect(() => {
    if (!settings.enabled) return;
    if (opts.isCached || opts.isDownloading) return;
    if (!net.online) return;
    if (settings.requireWifi && net.wifi !== true) return;
    if (settings.requireCharging && net.charging !== true) return;
    opts.triggerDownload();
  }, [
    settings.enabled,
    settings.requireWifi,
    settings.requireCharging,
    net.online,
    net.wifi,
    net.charging,
    opts.isCached,
    opts.isDownloading,
    opts.triggerDownload,
    opts,
  ]);

  const reason = (() => {
    if (!settings.enabled) return "off" as const;
    if (opts.isCached) return "cached" as const;
    if (opts.isDownloading) return "downloading" as const;
    if (!net.online) return "offline" as const;
    if (settings.requireWifi && net.wifi === false) return "not-wifi" as const;
    if (settings.requireWifi && net.wifi === null) return "wifi-unknown" as const;
    if (settings.requireCharging && net.charging === false) return "not-charging" as const;
    if (settings.requireCharging && net.charging === null) return "charging-unknown" as const;
    return "ready" as const;
  })();

  return { settings, setSettings, net, reason };
}
