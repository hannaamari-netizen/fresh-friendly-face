import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Bell,
  BellOff,
  RotateCcw,
  Plus,
  Trash2,
  X,
  GripVertical,
  Settings2,
} from "lucide-react";

export const Route = createFileRoute("/tasbih")({
  head: () => ({
    meta: [
      { title: "Tasbih Counter — Haya Al-Salat" },
      {
        name: "description",
        content:
          "A gentle tasbih counter for SubhanAllah, Alhamdulillah, Allahu Akbar, La ilaha illa Allah and Astaghfir Allah with daily reminder notifications.",
      },
      { property: "og:title", content: "Tasbih Counter — Haya Al-Salat" },
      {
        property: "og:description",
        content: "Count your dhikr with a beautiful tasbih counter and daily reminders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TasbihPage,
});

type Phrase = { arabic: string; latin: string; meaning: string };
type TasbihState = { phrase: number; count: number; total: number; target: number };
const KEY = "haya-tasbih";
const PHRASES_KEY = "haya-tasbih-phrases";
const REMINDER_KEY = "haya-tasbih-reminder";

const DEFAULT_PHRASES: Phrase[] = [
  { arabic: "سُبْحَانَ الله", latin: "SubhanAllah", meaning: "Glory be to Allah" },
  { arabic: "الْحَمْدُ لِلَّه", latin: "Alhamdulillah", meaning: "All praise is due to Allah" },
  { arabic: "اللهُ أَكْبَر", latin: "Allahu Akbar", meaning: "Allah is the Greatest" },
  { arabic: "لَا إِلَهَ إِلَّا الله", latin: "La ilaha illa Allah", meaning: "There is no god but Allah" },
  { arabic: "أَسْتَغْفِرُ الله", latin: "Astaghfir Allah", meaning: "I seek forgiveness from Allah" },
];

const TARGETS = [33, 100, 1000];

function loadPhrases(): Phrase[] {
  try {
    const raw = localStorage.getItem(PHRASES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_PHRASES;
}

function savePhrases(phrases: Phrase[]) {
  try {
    localStorage.setItem(PHRASES_KEY, JSON.stringify(phrases));
  } catch {}
}

function loadState(phrases: Phrase[]): TasbihState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        phrase: Math.min(Math.max(0, p.phrase ?? 0), phrases.length - 1),
        count: Math.max(0, p.count ?? 0),
        total: Math.max(0, p.total ?? 0),
        target: TARGETS.includes(p.target) ? p.target : 33,
      };
    }
  } catch {}
  return { phrase: 0, count: 0, total: 0, target: 33 };
}

function TasbihPage() {
  const [phrases, setPhrases] = useState<Phrase[]>(DEFAULT_PHRASES);
  const DEFAULT: TasbihState = { phrase: 0, count: 0, total: 0, target: 33 };
  const [state, setState] = useState<TasbihState>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);
  const [notifUnsupported, setNotifUnsupported] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [justHitTarget, setJustHitTarget] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newPhrase, setNewPhrase] = useState<Phrase>({ arabic: "", latin: "", meaning: "" });

  // Load persisted state after mount to avoid SSR/client hydration mismatch.
  useEffect(() => {
    const loaded = loadPhrases();
    setPhrases(loaded);
    setState(loadState(loaded));
    setNotifUnsupported(typeof Notification === "undefined");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) return;
    savePhrases(phrases);
  }, [hydrated, phrases]);

  // Load reminder prefs + run the reminder check every minute.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(REMINDER_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        setReminderEnabled(!!p.enabled);
        if (typeof p.time === "string") setReminderTime(p.time);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(REMINDER_KEY, JSON.stringify({ enabled: reminderEnabled, time: reminderTime }));
    } catch {}
  }, [reminderEnabled, reminderTime]);

  useEffect(() => {
    if (!reminderEnabled || typeof Notification === "undefined") return;
    const check = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      if (`${hh}:${mm}` !== reminderTime) return;
      const firedKey = `haya-tasbih-reminder-fired-${now.toDateString()}`;
      if (localStorage.getItem(firedKey)) return;
      localStorage.setItem(firedKey, "1");
      new Notification("Tasbih time 🤲", {
        body: "Take a quiet moment for dhikr — open your tasbih counter.",
        icon: "/icons/icon-192.png",
        tag: "haya-tasbih-reminder",
      });
    };
    const id = setInterval(check, 30000);
    check();
    return () => clearInterval(id);
  }, [reminderEnabled, reminderTime]);

  const increment = useCallback(() => {
    setState((s) => {
      const next = s.count + 1;
      if (next >= s.target) {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(60);
        setJustHitTarget(true);
        setTimeout(() => setJustHitTarget(false), 1800);
      } else if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(8);
      }
      return { ...s, count: next >= s.target ? 0 : next, total: s.total + 1 };
    });
  }, []);

  const toggleReminder = async () => {
    if (!reminderEnabled && typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    setReminderEnabled((v) => !v);
  };

  function movePhrase(i: number, dir: -1 | 1) {
    setPhrases((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      // Keep the selected phrase following its item.
      setState((s) => ({ ...s, phrase: s.phrase === i ? j : s.phrase === j ? i : s.phrase }));
      return next;
    });
  }

  function removePhrase(i: number) {
    setPhrases((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, idx) => idx !== i);
      setState((s) => ({
        ...s,
        phrase: Math.min(s.phrase, next.length - 1),
        count: 0,
      }));
      return next;
    });
  }

  function addPhrase() {
    const arabic = newPhrase.arabic.trim();
    const latin = newPhrase.latin.trim();
    if (!arabic && !latin) return;
    const phrase: Phrase = {
      arabic: arabic || latin,
      latin: latin || arabic,
      meaning: newPhrase.meaning.trim() || "Dhikr",
    };
    setPhrases((prev) => [...prev, phrase]);
    setNewPhrase({ arabic: "", latin: "", meaning: "" });
  }

  function resetPhrases() {
    setPhrases(DEFAULT_PHRASES);
    setState((s) => ({ ...s, phrase: 0, count: 0 }));
  }

  const phrase = phrases[state.phrase];

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden safe-px">
      <div className="mx-auto w-full max-w-md px-4 pb-16 pt-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Back to home"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="font-arabic text-xl leading-tight" style={{ color: "var(--gold-soft)" }} dir="rtl">
              التَّسْبِيح
            </p>
            <h1 className="font-display text-lg leading-tight">Tasbih Counter</h1>
          </div>
        </div>

        {/* Phrase picker */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {phrases.map((p, i) => (
            <button
              key={`${p.latin}-${i}`}
              onClick={() => setState((s) => ({ ...s, phrase: i, count: 0 }))}
              aria-pressed={state.phrase === i}
              className="rounded-2xl border px-3 py-2.5 text-center transition"
              style={{
                borderColor: state.phrase === i ? "var(--gold)" : "oklch(1 0 0 / 0.12)",
                background: state.phrase === i ? "oklch(0.82 0.13 85 / 0.15)" : "oklch(0 0 0 / 0.2)",
              }}
            >
              <span className="font-arabic block text-base" style={{ color: "var(--gold-soft)" }} dir="rtl">
                {p.arabic}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">{p.latin}</span>
            </button>
          ))}
        </div>

        {/* Counter */}
        <button
          onClick={increment}
          aria-label={`Count ${phrase?.latin ?? "dhikr"}`}
          className="mt-4 flex w-full flex-col items-center rounded-3xl border border-white/10 bg-black/20 px-6 py-10 transition active:scale-[0.98]"
        >
          <span className="font-arabic text-3xl" style={{ color: "var(--gold-soft)" }} dir="rtl">
            {phrase?.arabic}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">{phrase?.meaning}</span>
          <span
            className="mt-6 font-display text-7xl tabular-nums"
            style={{ color: justHitTarget ? "var(--gold)" : "var(--foreground)" }}
          >
            {state.count}
          </span>
          <span className="mt-2 text-xs text-muted-foreground">
            of {state.target} · tap to count
          </span>
          {justHitTarget && (
            <span className="mt-3 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-[11px]" style={{ color: "var(--gold)" }}>
              Masha'Allah — target reached ✨
            </span>
          )}
        </button>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {TARGETS.map((t) => (
              <button
                key={t}
                onClick={() => setState((s) => ({ ...s, target: t, count: 0 }))}
                aria-pressed={state.target === t}
                className="rounded-full border px-3 py-1 text-xs transition"
                style={{
                  borderColor: state.target === t ? "var(--gold)" : "oklch(1 0 0 / 0.12)",
                  color: state.target === t ? "var(--gold)" : "var(--muted-foreground)",
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => setState((s) => ({ ...s, count: 0 }))}
            className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Lifetime dhikr counted: <span className="tabular-nums font-medium">{state.total}</span>
        </p>

        {/* Customize phrases */}
        <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 px-4 py-4">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" style={{ color: "var(--gold)" }} />
              <div className="text-left">
                <p className="text-sm font-medium">Customize phrases</p>
                <p className="text-[11px] text-muted-foreground">Add, remove, or reorder your dhikr list.</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{editing ? "Close" : "Edit"}</span>
          </button>

          {editing && (
            <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
              <ul className="space-y-2">
                {phrases.map((p, i) => (
                  <li
                    key={`edit-${p.latin}-${i}`}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-2.5 py-2"
                  >
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium">{p.latin}</p>
                      <p className="truncate text-[10px] text-muted-foreground/80" dir="rtl">
                        {p.arabic}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => movePhrase(i, -1)}
                        disabled={i === 0}
                        aria-label={`Move ${p.latin} up`}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => movePhrase(i, 1)}
                        disabled={i === phrases.length - 1}
                        aria-label={`Move ${p.latin} down`}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePhrase(i)}
                        disabled={phrases.length <= 1}
                        aria-label={`Remove ${p.latin}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition hover:text-destructive disabled:opacity-30"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-[11px] font-medium" style={{ color: "var(--gold)" }}>
                  Add a new phrase
                </p>
                <div className="mt-2 grid gap-2">
                  <input
                    value={newPhrase.arabic}
                    onChange={(e) => setNewPhrase((p) => ({ ...p, arabic: e.target.value }))}
                    placeholder="Arabic text"
                    dir="rtl"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-arabic"
                  />
                  <input
                    value={newPhrase.latin}
                    onChange={(e) => setNewPhrase((p) => ({ ...p, latin: e.target.value }))}
                    placeholder="Transliteration (e.g. SubhanAllah)"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  />
                  <input
                    value={newPhrase.meaning}
                    onChange={(e) => setNewPhrase((p) => ({ ...p, meaning: e.target.value }))}
                    placeholder="Meaning (optional)"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={addPhrase}
                  disabled={!newPhrase.arabic.trim() && !newPhrase.latin.trim()}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium transition disabled:opacity-50"
                  style={{ borderColor: "var(--gold)", color: "var(--gold)" }}
                >
                  <Plus className="h-3.5 w-3.5" /> Add phrase
                </button>
              </div>

              <button
                type="button"
                onClick={resetPhrases}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[11px] text-muted-foreground transition hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Restore defaults
              </button>
            </div>
          )}
        </div>

        {/* Reminder */}
        <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {reminderEnabled ? (
                <Bell className="h-4 w-4" style={{ color: "var(--gold)" }} />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Daily tasbih reminder</p>
                <p className="text-[11px] text-muted-foreground">
                  A gentle nudge to sit for dhikr each day.
                </p>
              </div>
            </div>
            <button
              onClick={toggleReminder}
              disabled={notifUnsupported}
              aria-pressed={reminderEnabled}
              className="relative h-6 w-11 shrink-0 rounded-full border border-white/10 transition"
              style={{ background: reminderEnabled ? "var(--gold)" : "oklch(0 0 0 / 0.3)" }}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
                style={{ left: reminderEnabled ? 22 : 2 }}
              />
            </button>
          </div>
          {reminderEnabled && (
            <div className="mt-3 flex items-center gap-2">
              <label htmlFor="tasbih-time" className="text-xs text-muted-foreground">
                Remind me at
              </label>
              <input
                id="tasbih-time"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm"
              />
            </div>
          )}
          {notifUnsupported && (
            <p className="mt-2 text-[11px] text-muted-foreground/80">
              Notifications aren’t supported in this browser.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
