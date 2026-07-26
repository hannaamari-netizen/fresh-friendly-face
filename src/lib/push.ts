// Browser-side push helpers. Registers the SW, subscribes with VAPID, and
// syncs the subscription to the server. Do not import from server code.

import type { PushSyncPayload } from "./push-types";

// VAPID public key — safe to embed; the private key stays on the server.
const VAPID_PUBLIC_KEY =
  "BAKHBjvo4Isdps4FJGg7zZSvCQgiriSV04VZwuvnPUFyFari_plw-YHQFP_goWFO1sLFX5bGxSF0EThYoOH9xzU";

const DEVICE_TOKEN_KEY = "haya-device-token";

function isPreviewOrDev() {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  if (window.top !== window.self) return true;
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return true;
  if (h.endsWith(".lovableproject.com") || h.endsWith(".lovableproject-dev.com")) return true;
  if (h.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getDeviceToken(): string {
  let t = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem(DEVICE_TOKEN_KEY, t);
  }
  return t;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

function bufToB64(buf: ArrayBuffer | null) {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export async function ensurePushSubscription() {
  if (!pushSupported() || isPreviewOrDev()) return null;
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  return sub;
}

export function subscriptionToPayload(
  sub: PushSubscription,
  extras: Omit<PushSyncPayload, "deviceToken" | "endpoint" | "p256dh" | "auth">,
): PushSyncPayload {
  const json = sub.toJSON();
  return {
    deviceToken: getDeviceToken(),
    endpoint: json.endpoint ?? sub.endpoint,
    p256dh: json.keys?.p256dh ?? bufToB64(sub.getKey("p256dh")),
    auth: json.keys?.auth ?? bufToB64(sub.getKey("auth")),
    ...extras,
  };
}

export async function removeLocalSubscription() {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    await sub?.unsubscribe();
  } catch {}
}
