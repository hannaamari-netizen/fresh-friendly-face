import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

type Props = { fajrDate: Date | null };

const STORAGE_KEY = "haya-fajr-reminder";
const OFFSETS = [5, 15, 30, 60];

type Settings = { enabled: boolean; offset: number };

function loadSettings(): Settings {
  if (typeof window === "undefined") return { enabled: false, offset: 15 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: false, offset: 15 };
}

export function FajrReminder({ fajrDate }: Props) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const supported = typeof window !== "undefined" && "Notification" in window;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);

  // Schedule notification. fajrDate is an absolute UTC instant computed in the
  // location's timezone, so this fires correctly across travel and DST.
  useEffect(() => {
    if (!settings.enabled || !fajrDate || permission !== "granted") return;
    let id: number | undefined;

    const schedule = () => {
      if (id !== undefined) window.clearTimeout(id);
      const fireAt = fajrDate.getTime() - settings.offset * 60 * 1000;
      const delay = fireAt - Date.now();
      if (delay <= 0 || delay > 2_147_000_000) return;
      id = window.setTimeout(() => {
        try {
          new Notification("Haya Al-Salat", {
            body: `Fajr is in ${settings.offset} minutes. Wake gently for the prayer of the dawn.`,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: "fajr-reminder",
          });
        } catch {}
      }, delay);
    };

    schedule();
    // Re-arm the timer when the tab regains focus — device sleep, travel, or
    // DST can invalidate the pending setTimeout delay.
    const onVis = () => { if (document.visibilityState === "visible") schedule(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (id !== undefined) window.clearTimeout(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [settings, fajrDate, permission]);

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
      setSettings((s) => ({ ...s, enabled: false }));
    }
  }

  const active = settings.enabled && permission === "granted";

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
        </div>
      )}
    </div>
  );
}
