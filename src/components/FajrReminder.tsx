import { useEffect, useState } from "react";
import { Bell, BellOff, CloudMoon } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  ensurePushSubscription,
  getDeviceToken,
  pushSupported,
  removeLocalSubscription,
  subscriptionToPayload,
} from "@/lib/push";
import { deletePushSubscription, savePushSubscription } from "@/lib/push.functions";

type Props = {
  fajrDate: Date | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
};

const STORAGE_KEY = "haya-fajr-reminder";
const OFFSETS = [5, 15, 30, 60];
const DEFAULT_MESSAGE = "Fajr is in {minutes} minutes. Wake gently for the prayer of the dawn.";
const MAX_MESSAGE_LEN = 140;
const GLOBAL_TZ_KEY = "__global__";

type Settings = {
  enabled: boolean;
  offset: number;
  /** Legacy single template; kept as fallback for any timezone without an override. */
  message: string;
  /** Per-IANA-timezone reminder templates. */
  messages: Record<string, string>;
  background: boolean;
};

function loadSettings(): Settings {
  const base: Settings = {
    enabled: false,
    offset: 15,
    message: DEFAULT_MESSAGE,
    messages: {},
    background: false,
  };
  if (typeof window === "undefined") return base;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        enabled: !!p.enabled,
        offset: p.offset ?? 15,
        message: p.message ?? DEFAULT_MESSAGE,
        messages: p.messages && typeof p.messages === "object" ? p.messages : {},
        background: !!p.background,
      };
    }
  } catch {}
  return base;
}

function tzKey(tz: string | null | undefined) {
  return (tz && tz.trim()) || GLOBAL_TZ_KEY;
}

function messageFor(settings: Settings, tz: string | null | undefined) {
  const key = tzKey(tz);
  return settings.messages[key] ?? settings.message ?? DEFAULT_MESSAGE;
}

function renderMessage(template: string, minutes: number) {
  const t = (template || DEFAULT_MESSAGE).trim() || DEFAULT_MESSAGE;
  return t.replace(/\{minutes\}/gi, String(minutes));
}

export function FajrReminder({ fajrDate, timezone, latitude, longitude }: Props) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [bgStatus, setBgStatus] = useState<"idle" | "syncing" | "on" | "error">("idle");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "sent">("idle");
  const supported = typeof window !== "undefined" && "Notification" in window;
  const canBackground = pushSupported();

  const activeTz =
    timezone ||
    (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC");
  const activeTemplate = messageFor(settings, activeTz);

  function setTemplateForActiveTz(value: string) {
    setSettings((s) => ({
      ...s,
      messages: { ...s.messages, [tzKey(activeTz)]: value },
    }));
  }

  function resetTemplateForActiveTz() {
    setSettings((s) => {
      const next = { ...s.messages };
      delete next[tzKey(activeTz)];
      return { ...s, messages: next };
    });
  }

  const savePush = useServerFn(savePushSubscription);
  const removePush = useServerFn(deletePushSubscription);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);

  // In-tab fallback timer (only used when background isn't active).
  useEffect(() => {
    if (!settings.enabled || settings.background || !fajrDate || permission !== "granted") return;
    let id: number | undefined;
    const schedule = () => {
      if (id !== undefined) window.clearTimeout(id);
      const fireAt = fajrDate.getTime() - settings.offset * 60 * 1000;
      const delay = fireAt - Date.now();
      if (delay <= 0 || delay > 2_147_000_000) return;
      id = window.setTimeout(() => {
        try {
          new Notification("Haya Al-Salat", {
            body: renderMessage(activeTemplate, settings.offset),
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: "fajr-reminder",
          });
        } catch {}
      }, delay);
    };
    schedule();
    const onVis = () => { if (document.visibilityState === "visible") schedule(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (id !== undefined) window.clearTimeout(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [settings, fajrDate, permission]);

  // Sync push subscription whenever background is on and settings/location change.
  useEffect(() => {
    if (!settings.enabled || !settings.background || permission !== "granted") return;
    if (!canBackground) return;
    let cancelled = false;
    (async () => {
      try {
        setBgStatus("syncing");
        const sub = await ensurePushSubscription();
        if (!sub) { if (!cancelled) setBgStatus("error"); return; }
        await savePush({
          data: subscriptionToPayload(sub, {
            timezone: timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
            latitude,
            longitude,
            offsetMinutes: settings.offset,
            messageTemplate: activeTemplate,
            title: "Haya Al-Salat",
            calcMethod: 2,
          }),
        });
        if (!cancelled) setBgStatus("on");
      } catch {
        if (!cancelled) setBgStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [
    settings.enabled, settings.background, settings.offset, activeTemplate,
    permission, timezone, latitude, longitude, canBackground, savePush,
  ]);

  async function toggle() {
    if (!supported) return;
    if (!settings.enabled) {
      let perm = permission;
      if (perm !== "granted") {
        perm = await Notification.requestPermission();
        setPermission(perm);
      }
      if (perm === "granted") setSettings((s) => ({ ...s, enabled: true }));
    } else {
      if (settings.background) {
        try { await removePush({ data: { deviceToken: getDeviceToken() } }); } catch {}
        await removeLocalSubscription();
      }
      setSettings((s) => ({ ...s, enabled: false, background: false }));
      setBgStatus("idle");
    }
  }

  async function toggleBackground() {
    if (!canBackground || permission !== "granted") return;
    if (settings.background) {
      try { await removePush({ data: { deviceToken: getDeviceToken() } }); } catch {}
      await removeLocalSubscription();
      setSettings((s) => ({ ...s, background: false }));
      setBgStatus("idle");
    } else {
      setSettings((s) => ({ ...s, background: true }));
    }
  }

  const active = settings.enabled && permission === "granted";
  async function sendTestNotification() {
    if (!supported) return;
    let perm = permission;
    if (perm !== "granted") {
      perm = await Notification.requestPermission();
      setPermission(perm);
    }
    if (perm !== "granted") return;
    setTestStatus("sending");
    const body = renderMessage(activeTemplate, settings.offset);
    try {
      // Prefer the SW so it works on iOS PWAs and matches real reminder delivery.
      const reg = canBackground ? await navigator.serviceWorker.getRegistration("/sw.js") : null;
      if (reg) {
        await reg.showNotification("Haya Al-Salat — test", {
          body,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: "fajr-reminder-test",
        });
      } else {
        new Notification("Haya Al-Salat — test", {
          body,
          icon: "/icon-192.png",
          tag: "fajr-reminder-test",
        });
      }
      setTestStatus("sent");
      window.setTimeout(() => setTestStatus("idle"), 2000);
    } catch {
      setTestStatus("idle");
    }
  }


  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          aria-label={active ? "Disable Fajr reminder" : "Enable Fajr reminder"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition"
          style={{
            borderColor: active ? "var(--gold)" : "oklch(1 0 0 / 0.15)",
            background: active ? "oklch(0.82 0.13 85 / 0.15)" : "transparent",
            color: active ? "var(--gold)" : "var(--foreground)",
          }}
        >
          {active ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base leading-tight">Fajr reminder</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {!supported
              ? "Notifications aren't supported on this device."
              : permission === "denied"
              ? "Notifications blocked in browser settings."
              : active
              ? `We'll gently notify you ${settings.offset} min before Fajr.`
              : "Get a gentle nudge before the call to Fajr."}
          </p>
        </div>
        {supported && permission !== "denied" && (
          <button
            type="button"
            onClick={sendTestNotification}
            className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:border-[var(--gold)]/60 hover:text-[var(--gold)]"
          >
            {testStatus === "sent" ? "Sent ✓" : testStatus === "sending" ? "Sending…" : "Test"}
          </button>
        )}
      </div>

      {active && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Notify me before
          </p>
          <div className="flex gap-2">
            {OFFSETS.map((o) => {
              const sel = settings.offset === o;
              return (
                <button
                  key={o}
                  onClick={() => setSettings((s) => ({ ...s, offset: o }))}
                  className="flex-1 rounded-full border px-3 py-2 text-xs font-medium transition"
                  style={{
                    borderColor: sel ? "var(--gold)" : "oklch(1 0 0 / 0.12)",
                    background: sel ? "oklch(0.82 0.13 85 / 0.15)" : "transparent",
                    color: sel ? "var(--gold)" : "var(--foreground)",
                  }}
                >
                  {o} min
                </button>
              );
            })}
          </div>

          {/* Background push toggle */}
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-[var(--gold)]">
              <CloudMoon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium">Background reminders</p>
                <button
                  onClick={toggleBackground}
                  disabled={!canBackground}
                  className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition disabled:opacity-40"
                  style={{
                    borderColor: settings.background ? "var(--gold)" : "oklch(1 0 0 / 0.15)",
                    background: settings.background ? "oklch(0.82 0.13 85 / 0.15)" : "transparent",
                    color: settings.background ? "var(--gold)" : "var(--foreground)",
                  }}
                >
                  {settings.background ? "On" : "Off"}
                </button>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                {!canBackground
                  ? "Not supported on this browser. Reminders will still work while the app is open."
                  : settings.background
                  ? bgStatus === "syncing"
                    ? "Syncing your reminder with our server…"
                    : bgStatus === "error"
                    ? "Couldn't sync. We'll retry — reminders still work while the app is open."
                    : "Delivered even when the app is closed."
                  : "Wakes you gently even when the app is closed."}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Reminder message
              </p>
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, message: DEFAULT_MESSAGE }))}
                className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-[var(--gold)]"
              >
                Reset
              </button>
            </div>
            <textarea
              value={settings.message}
              onChange={(e) =>
                setSettings((s) => ({ ...s, message: e.target.value.slice(0, MAX_MESSAGE_LEN) }))
              }
              rows={2}
              maxLength={MAX_MESSAGE_LEN}
              placeholder={DEFAULT_MESSAGE}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-[var(--gold)]/60"
            />
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>
                Use <span className="text-[var(--gold)]">{"{minutes}"}</span> for the countdown.
              </span>
              <span>{settings.message.length}/{MAX_MESSAGE_LEN}</span>
            </div>
            <p className="mt-2 text-[10px] italic text-muted-foreground/80">
              Preview: “{renderMessage(settings.message, settings.offset)}”
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
