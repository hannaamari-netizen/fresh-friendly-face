import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

type Props = { fajrDate: Date | null };

const STORAGE_KEY = "haya-fajr-reminder";
const OFFSETS = [5, 15, 30, 60];
const DEFAULT_MESSAGE = "Fajr is in {minutes} minutes. Wake gently for the prayer of the dawn.";
const MAX_MESSAGE_LEN = 140;

type Settings = { enabled: boolean; offset: number; message: string };

function loadSettings(): Settings {
  if (typeof window === "undefined") return { enabled: false, offset: 15, message: DEFAULT_MESSAGE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { enabled: !!p.enabled, offset: p.offset ?? 15, message: p.message ?? DEFAULT_MESSAGE };
    }
  } catch {}
  return { enabled: false, offset: 15, message: DEFAULT_MESSAGE };
}

function renderMessage(template: string, minutes: number) {
  const t = (template || DEFAULT_MESSAGE).trim() || DEFAULT_MESSAGE;
  return t.replace(/\{minutes\}/gi, String(minutes));
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
            body: renderMessage(settings.message, settings.offset),
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
