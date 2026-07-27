// Runtime device info. Prefers Capacitor's native Device API on iOS/Android;
// falls back to a User-Agent Client Hints / userAgent parse on the web so the
// About screen has something meaningful to show for PWA users too.
import { useEffect, useState } from "react";

export type DeviceInfo = {
  model: string;
  manufacturer: string;
  platform: "ios" | "android" | "web";
  osName: string;
  osVersion: string;
  source: "native" | "uach" | "ua";
};

const DEFAULT: DeviceInfo = {
  model: "Unknown",
  manufacturer: "Unknown",
  platform: "web",
  osName: "Unknown",
  osVersion: "Unknown",
  source: "ua",
};

type UADataBrand = { brand: string; version: string };
type UAData = {
  platform?: string;
  mobile?: boolean;
  brands?: UADataBrand[];
  getHighEntropyValues?: (
    hints: string[],
  ) => Promise<{ platformVersion?: string; model?: string; architecture?: string }>;
};

function parseUserAgent(ua: string): { osName: string; osVersion: string; model: string } {
  let osName = "Unknown";
  let osVersion = "Unknown";
  let model = "Unknown";
  // iOS / iPadOS
  let m = ua.match(/(iPhone|iPad|iPod);.*?OS (\d+[_.]\d+(?:[_.]\d+)?)/);
  if (m) {
    osName = m[1] === "iPad" ? "iPadOS" : "iOS";
    osVersion = m[2].replace(/_/g, ".");
    model = m[1];
    return { osName, osVersion, model };
  }
  // Android
  m = ua.match(/Android (\d+(?:\.\d+)*)(?:;\s*([^;)]+))?/);
  if (m) {
    osName = "Android";
    osVersion = m[1];
    if (m[2]) model = m[2].trim().replace(/\s+Build\/.*$/, "");
    return { osName, osVersion, model };
  }
  // macOS
  m = ua.match(/Mac OS X (\d+[_.]\d+(?:[_.]\d+)?)/);
  if (m) return { osName: "macOS", osVersion: m[1].replace(/_/g, "."), model: "Mac" };
  // Windows
  m = ua.match(/Windows NT (\d+\.\d+)/);
  if (m) {
    const map: Record<string, string> = { "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7" };
    return { osName: "Windows", osVersion: map[m[1]] ?? m[1], model: "PC" };
  }
  // Linux / ChromeOS
  if (/CrOS/.test(ua)) return { osName: "ChromeOS", osVersion: "Unknown", model: "Chromebook" };
  if (/Linux/.test(ua)) return { osName: "Linux", osVersion: "Unknown", model: "PC" };
  return { osName, osVersion, model };
}

export function useDeviceInfo(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(DEFAULT);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Try native Capacitor first
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform()) {
          const { Device } = await import("@capacitor/device");
          const [d] = await Promise.all([Device.getInfo()]);
          if (cancelled) return;
          const platform = (d.platform === "ios" || d.platform === "android"
            ? d.platform
            : "web") as DeviceInfo["platform"];
          setInfo({
            model: d.model || "Unknown",
            manufacturer: d.manufacturer || (platform === "ios" ? "Apple" : "Unknown"),
            platform,
            osName:
              d.operatingSystem === "ios"
                ? "iOS"
                : d.operatingSystem === "android"
                  ? "Android"
                  : d.operatingSystem || "Unknown",
            osVersion: d.osVersion || "Unknown",
            source: "native",
          });
          return;
        }
      } catch {
        /* fall through to web detection */
      }

      // Web fallback
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
      const parsed = parseUserAgent(ua);
      let source: DeviceInfo["source"] = "ua";
      let osVersion = parsed.osVersion;
      let model = parsed.model;

      // Prefer high-entropy UA Client Hints when available (Chromium)
      try {
        const uaData = (navigator as unknown as { userAgentData?: UAData }).userAgentData;
        if (uaData?.getHighEntropyValues) {
          const high = await uaData.getHighEntropyValues(["platformVersion", "model"]);
          if (!cancelled) {
            if (high.platformVersion) osVersion = high.platformVersion;
            if (high.model) model = high.model;
            source = "uach";
          }
        }
      } catch {
        /* ignore */
      }

      if (cancelled) return;
      setInfo({
        model,
        manufacturer: /iPhone|iPad|iPod|Mac/.test(ua) ? "Apple" : "Unknown",
        platform: "web",
        osName: parsed.osName,
        osVersion,
        source,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}
