import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  Square,
  SkipForward,
  ThumbsUp,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Mail,
  ListChecks,
} from "lucide-react";
import { ADHAN_FAJR_URL, ADHAN_URL, cachedAdhanSrc } from "@/lib/adhan";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
type Prayer = (typeof PRAYERS)[number];

/** Seconds of each adhan to play before moving to the next prayer. */
const CLIP_SECONDS = 15;

type Verdict = "ok" | "issue";

function srcFor(prayer: Prayer) {
  return prayer === "Fajr" ? ADHAN_FAJR_URL : ADHAN_URL;
}

export function AdhanTest({ volume = 0.8 }: { volume?: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [index, setIndex] = useState<number | null>(null); // null = idle
  const [remaining, setRemaining] = useState(CLIP_SECONDS);
  const [done, setDone] = useState(false);
  const [ratings, setRatings] = useState<Partial<Record<Prayer, Verdict>>>({});
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const stop = useCallback(() => {
    clearTimer();
    const el = audioRef.current;
    if (el) {
      try {
        el.pause();
        el.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
    setIndex(null);
    setRemaining(CLIP_SECONDS);
  }, []);

  const playAt = useCallback(
    async (i: number) => {
      if (i >= PRAYERS.length) {
        clearTimer();
        const el = audioRef.current;
        if (el) {
          try {
            el.pause();
          } catch {
            /* ignore */
          }
        }
        setIndex(null);
        setDone(true);
        return;
      }
      setIndex(i);
      setRemaining(CLIP_SECONDS);
      const el = audioRef.current;
      if (!el) return;
      const resolved = await cachedAdhanSrc(srcFor(PRAYERS[i]));
      el.src = resolved;
      el.volume = volume;
      try {
        el.currentTime = 0;
        await el.play();
      } catch {
        setStatus("Tap “Start test” again — your device blocked autoplay.");
      }
    },
    [volume],
  );

  // Countdown that advances the sequence.
  useEffect(() => {
    if (index === null) return;
    clearTimer();
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          void playAt(index + 1);
          return CLIP_SECONDS;
        }
        return r - 1;
      });
    }, 1000);
    return clearTimer;
  }, [index, playAt]);

  useEffect(() => () => clearTimer(), []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  function start() {
    setDone(false);
    setRatings({});
    setNote("");
    setStatus(null);
    void playAt(0);
  }

  function rate(prayer: Prayer, verdict: Verdict) {
    setRatings((r) => ({ ...r, [prayer]: verdict }));
  }

  function buildReport() {
    const lines = [
      "Haya Al-Salat — Adhan test report",
      `Date: ${new Date().toISOString()}`,
      `Volume: ${Math.round(volume * 100)}%`,
      "",
      ...PRAYERS.map((p) => {
        const v = ratings[p];
        return `${p}: ${v === "ok" ? "sounds good" : v === "issue" ? "PROBLEM" : "not rated"} (${srcFor(p)})`;
      }),
      "",
      `Notes: ${note.trim() || "—"}`,
    ];
    return lines.join("\n");
  }

  async function saveAndCopy() {
    const report = buildReport();
    try {
      localStorage.setItem("haya-adhan-test-report", report);
    } catch {
      /* ignore */
    }
    try {
      await navigator.clipboard.writeText(report);
      setStatus("Report copied — paste it anywhere to share.");
    } catch {
      setStatus("Report saved on this device.");
    }
  }

  const active = index !== null ? PRAYERS[index] : null;
  const issues = PRAYERS.filter((p) => ratings[p] === "issue");
  const rated = PRAYERS.filter((p) => ratings[p]).length;

  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
      <div className="mb-2 flex items-center gap-2">
        <ListChecks className="h-3.5 w-3.5 text-[var(--gold)]" />
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Adhan test mode
        </p>
      </div>

      {active ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--gold)" }}>
                Now playing: {active}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {active === "Fajr" ? "Special Fajr adhan" : "Regular adhan"} ·{" "}
                {index! + 1} of {PRAYERS.length} · next in {remaining}s
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => void playAt(index! + 1)}
                aria-label="Skip to next prayer"
                className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3 text-[11px] text-muted-foreground transition hover:text-[var(--gold)]"
              >
                <SkipForward className="h-3.5 w-3.5" /> Next
              </button>
              <button
                type="button"
                onClick={stop}
                aria-label="Stop Adhan test"
                className="flex h-9 items-center gap-1.5 rounded-full border px-3 text-[11px] transition"
                style={{ borderColor: "var(--gold)", color: "var(--gold)" }}
              >
                <Square className="h-3.5 w-3.5" /> Stop
              </button>
            </div>
          </div>
          <div className="mt-3 flex gap-1">
            {PRAYERS.map((p, i) => (
              <span
                key={p}
                className="h-1 flex-1 rounded-full"
                style={{
                  background:
                    i <= index! ? "var(--gold)" : "oklch(1 0 0 / 0.12)",
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={start}
          className="flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[12px] font-medium transition"
          style={{ borderColor: "var(--gold)", color: "var(--gold)" }}
        >
          <Play className="h-3.5 w-3.5" />
          {done ? "Run test again" : "Start test — Fajr through Isha"}
        </button>
      )}

      {!active && !done && (
        <p className="mt-2 text-[10px] text-muted-foreground/80">
          Plays {CLIP_SECONDS} seconds of each prayer’s alert in order, so you can
          check your iPhone speakers in under two minutes.
        </p>
      )}

      {done && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] font-medium" style={{ color: "var(--gold)" }}>
            How did each one sound?
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/80">
            Tap 👍 if it played clearly, or flag an issue (silence, wrong voice,
            delay, low volume).
          </p>
          <ul className="mt-2 space-y-1.5">
            {PRAYERS.map((p) => {
              const v = ratings[p];
              return (
                <li key={p} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-foreground/90">{p}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => rate(p, "ok")}
                      aria-label={`${p} adhan sounded good`}
                      aria-pressed={v === "ok"}
                      className="flex h-7 w-7 items-center justify-center rounded-full border transition"
                      style={{
                        borderColor: v === "ok" ? "var(--gold)" : "oklch(1 0 0 / 0.12)",
                        color: v === "ok" ? "var(--gold)" : "var(--muted-foreground)",
                      }}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => rate(p, "issue")}
                      aria-label={`Report an issue with the ${p} adhan`}
                      aria-pressed={v === "issue"}
                      className="flex h-7 w-7 items-center justify-center rounded-full border transition"
                      style={{
                        borderColor:
                          v === "issue" ? "var(--destructive)" : "oklch(1 0 0 / 0.12)",
                        color:
                          v === "issue" ? "var(--destructive)" : "var(--muted-foreground)",
                      }}
                    >
                      <AlertTriangle className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {issues.length > 0 && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`What went wrong with ${issues.join(", ")}?`}
              aria-label="Describe the adhan issue"
              rows={2}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:border-[var(--gold)] focus:outline-none"
            />
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void saveAndCopy()}
              className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-muted-foreground transition hover:text-[var(--gold)]"
            >
              <Copy className="h-3 w-3" /> Copy report
            </button>
            <a
              href={`mailto:support@hayaalsalat.com?subject=${encodeURIComponent(
                "Adhan test report — Haya Al-Salat",
              )}&body=${encodeURIComponent(buildReport())}`}
              className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-muted-foreground transition hover:text-[var(--gold)]"
            >
              <Mail className="h-3 w-3" /> Email report
            </a>
            {rated === PRAYERS.length && issues.length === 0 && (
              <span
                className="flex items-center gap-1.5 text-[10px]"
                style={{ color: "var(--gold)" }}
              >
                <CheckCircle2 className="h-3 w-3" /> All five sound good
              </span>
            )}
          </div>
        </div>
      )}

      {status && (
        <p className="mt-2 text-[10px] text-muted-foreground/80">{status}</p>
      )}

      <audio ref={audioRef} preload="none" />
    </div>
  );
}
