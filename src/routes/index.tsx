import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, MapPin, Moon, Sunrise, Volume2, VolumeX, Download, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { FajrReminder } from "@/components/FajrReminder";
import { SplashScreen } from "@/components/SplashScreen";
import { useOfflineAudio } from "@/hooks/useOfflineAudio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Haya Al-Salat — A Peaceful Fajr Companion" },
      { name: "description", content: "A peaceful companion that gently prepares Muslims to wake for Fajr through the beautiful recitation of Surat Al-Mu'minun by Mukhtar Al-Hajj. Begin the day with remembrance of Allah." },
      { property: "og:title", content: "Haya Al-Salat — A Peaceful Fajr Companion" },
      { property: "og:description", content: "A peaceful companion that gently prepares Muslims to wake for Fajr through the beautiful recitation of Surat Al-Mu'minun by Mukhtar Al-Hajj." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HayaAlSalat,
});

const SURAH_URL =
  "https://server16.mp3quran.net/mukhtar_haj/Rewayat-Hafs-A-n-Assem/023.mp3";

type Timings = {
  Fajr: string; Sunrise: string; Dhuhr: string; Asr: string; Maghrib: string; Isha: string;
};

type LocInfo = { city: string; country: string; lat: number; lon: number } | null;

function pad(n: number) { return n.toString().padStart(2, "0"); }

function parseHHMM(hhmm: string, base: Date) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function Stars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        top: Math.random() * 70,
        left: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 3,
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={i}
          className="star absolute rounded-full bg-white"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            boxShadow: "0 0 6px rgba(255,255,255,0.6)",
          }}
        />
      ))}
    </div>
  );
}

function HayaAlSalat() {
  const now = useNow(1000);
  const [timings, setTimings] = useState<Timings | null>(null);
  const [loc, setLoc] = useState<LocInfo>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const offline = useOfflineAudio(SURAH_URL);

  // Fetch location + prayer times
  useEffect(() => {
    let cancelled = false;
    async function load(lat: number, lon: number) {
      const d = new Date();
      const date = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
      try {
        const res = await fetch(
          `https://api.aladhan.com/v1/timings/${date}?latitude=${lat}&longitude=${lon}&method=2`
        );
        const j = await res.json();
        if (cancelled) return;
        setTimings(j.data.timings);
        const m = j.data.meta;
        setLoc({
          city: j.data.meta.timezone.split("/").pop()?.replace(/_/g, " ") ?? "Your city",
          country: "",
          lat: m.latitude,
          lon: m.longitude,
        });
        setLoading(false);
      } catch (e) {
        setError("Couldn't fetch prayer times.");
        setLoading(false);
      }
    }
    if (!navigator.geolocation) {
      load(21.4225, 39.8262); // Mecca fallback
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => load(pos.coords.latitude, pos.coords.longitude),
      () => load(21.4225, 39.8262),
      { timeout: 5000 }
    );
    return () => { cancelled = true; };
  }, []);

  // Compute Fajr countdown
  const fajrInfo = useMemo(() => {
    if (!timings) return null;
    const today = new Date();
    let fajr = parseHHMM(timings.Fajr, today);
    if (fajr.getTime() < now.getTime()) {
      // next day approx (times shift slightly but this is a graceful fallback)
      fajr = new Date(fajr.getTime() + 24 * 60 * 60 * 1000);
    }
    const diff = fajr.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { fajr, h, m, s, diff };
  }, [timings, now]);

  const prayerRows = timings
    ? [
        { key: "Fajr", label: "Fajr", ar: "الفجر", time: timings.Fajr },
        { key: "Sunrise", label: "Sunrise", ar: "الشروق", time: timings.Sunrise },
        { key: "Dhuhr", label: "Dhuhr", ar: "الظهر", time: timings.Dhuhr },
        { key: "Asr", label: "Asr", ar: "العصر", time: timings.Asr },
        { key: "Maghrib", label: "Maghrib", ar: "المغرب", time: timings.Maghrib },
        { key: "Isha", label: "Isha", ar: "العشاء", time: timings.Isha },
      ]
    : [];

  // Determine which prayer is next
  const nextPrayerKey = useMemo(() => {
    if (!timings) return "Fajr";
    const today = new Date();
    const order: (keyof Timings)[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    for (const k of order) {
      if (parseHHMM(timings[k], today).getTime() > now.getTime()) return k;
    }
    return "Fajr";
  }, [timings, now]);

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) { el.play(); setPlaying(true); }
    else { el.pause(); setPlaying(false); }
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      <SplashScreen />
      <Stars />

      {/* Moon glow */}
      <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full float-slow"
           style={{ background: "radial-gradient(circle, oklch(0.9 0.05 90 / 0.35), transparent 70%)" }} />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-12 pt-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold-soft/80" style={{ color: "var(--gold-soft)" }}>
            <Moon className="h-3.5 w-3.5" />
            <span>Haya Al-Salat</span>
          </div>
          {loc && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="capitalize">{loc.city}</span>
            </div>
          )}
        </header>

        {/* Title */}
        <div className="mt-10 text-center">
          <p className="font-arabic text-2xl leading-none" style={{ color: "var(--gold-soft)" }}>
            حَيَّ عَلَى الصَّلَاة
          </p>
          <h1 className="mt-4 font-display text-5xl font-medium leading-tight gold-shimmer">
            Wake gently<br />before Fajr.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            A peaceful companion to begin the day with remembrance of Allah.
          </p>
        </div>

        {/* Countdown */}
        <section className="mt-10">
          {loading && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-muted-foreground">
              Aligning with the sky...
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-muted-foreground">
              {error}
            </div>
          )}
          {fajrInfo && !loading && (
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 backdrop-blur">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Sunrise className="h-3 w-3" style={{ color: "var(--gold)" }} />
                  Time until Fajr
                </span>
                <span style={{ color: "var(--gold)" }}>{timings?.Fajr}</span>
              </div>
              <div className="mt-4 flex items-end justify-center gap-3 font-display">
                <TimeUnit value={pad(fajrInfo.h)} label="hrs" />
                <span className="pb-3 text-3xl text-white/30">:</span>
                <TimeUnit value={pad(fajrInfo.m)} label="min" />
                <span className="pb-3 text-3xl text-white/30">:</span>
                <TimeUnit value={pad(fajrInfo.s)} label="sec" />
              </div>
            </div>
          )}
        </section>

        {/* Fajr reminder */}
        <section className="mt-6">
          <FajrReminder fajrDate={fajrInfo?.fajr ?? null} />
        </section>

        {/* Recitation player */}
        <section className="mt-6">
          <div className="rounded-3xl border border-white/10 bg-black/25 p-5 backdrop-blur">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                aria-label={playing ? "Pause recitation" : "Play recitation"}
                className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95"
                style={{
                  background: "linear-gradient(140deg, var(--gold), oklch(0.65 0.14 40))",
                  color: "var(--primary-foreground)",
                  boxShadow: "0 10px 30px -8px oklch(0.7 0.15 45 / 0.6)",
                }}
              >
                <span className={playing ? "pulse-ring absolute inset-0 rounded-full" : ""} />
                {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 translate-x-0.5" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-arabic text-lg leading-tight" style={{ color: "var(--gold-soft)" }}>
                  سورة المؤمنون
                </p>
                <p className="mt-0.5 font-display text-lg leading-tight">Surat Al-Mu'minun</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  Recited by Mukhtar Al-Hajj
                </p>
              </div>
              <button
                onClick={() => {
                  if (!audioRef.current) return;
                  audioRef.current.muted = !audioRef.current.muted;
                  setMuted(audioRef.current.muted);
                }}
                aria-label={muted ? "Unmute" : "Mute"}
                className="rounded-full p-2 text-muted-foreground transition hover:text-foreground"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: duration ? `${(progress / duration) * 100}%` : "0%",
                    background: "linear-gradient(90deg, var(--gold), var(--dawn))",
                  }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted-foreground">
                <span>{fmtTime(progress)}</span>
                <span>{duration ? fmtTime(duration) : "--:--"}</span>
              </div>
            </div>

            {/* Offline caching */}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-black/20 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium" style={{ color: "var(--gold-soft)" }}>
                  {offline.status === "cached"
                    ? "Saved for offline"
                    : offline.status === "downloading"
                    ? `Saving… ${offline.progress}%`
                    : offline.status === "error"
                    ? "Couldn't save — try again"
                    : "Save for weak connection"}
                </p>
                {offline.status === "downloading" && (
                  <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${offline.progress}%`,
                        background: "linear-gradient(90deg, var(--gold), var(--dawn))",
                      }}
                    />
                  </div>
                )}
                {offline.status !== "downloading" && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {offline.status === "cached"
                      ? "Plays without internet."
                      : "Download once, listen anywhere."}
                  </p>
                )}
              </div>
              {offline.status === "cached" ? (
                <button
                  onClick={offline.clear}
                  aria-label="Remove offline copy"
                  className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-muted-foreground transition hover:text-foreground"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
                  Saved
                </button>
              ) : offline.status === "downloading" ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--gold)" }} />
                </span>
              ) : (
                <button
                  onClick={offline.download}
                  aria-label="Save recitation for offline"
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition active:scale-95"
                  style={{
                    background: "linear-gradient(140deg, var(--gold), oklch(0.65 0.14 40))",
                    color: "var(--primary-foreground)",
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Save
                </button>
              )}
            </div>

            <audio
              ref={audioRef}
              src={offline.localUrl ?? SURAH_URL}
              preload="metadata"
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
              onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
              onEnded={() => setPlaying(false)}
            />
          </div>
        </section>

        {/* Prayer times list */}
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl">Today's Prayers</h2>
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>
          <ul className="space-y-1.5">
            {prayerRows.map((p) => {
              const isNext = p.key === nextPrayerKey;
              return (
                <li
                  key={p.key}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 transition ${
                    isNext ? "border" : "border border-white/5"
                  }`}
                  style={
                    isNext
                      ? {
                          background:
                            "linear-gradient(90deg, oklch(0.82 0.13 85 / 0.12), transparent)",
                          borderColor: "oklch(0.82 0.13 85 / 0.4)",
                        }
                      : { background: "oklch(1 0 0 / 0.03)" }
                  }
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: isNext ? "var(--gold)" : "oklch(1 0 0 / 0.2)" }}
                    />
                    <div>
                      <p className="font-display text-base leading-tight">{p.label}</p>
                      <p className="font-arabic text-xs text-muted-foreground">{p.ar}</p>
                    </div>
                  </div>
                  <span
                    className="font-display text-lg tabular-nums"
                    style={{ color: isNext ? "var(--gold)" : "var(--foreground)" }}
                  >
                    {p.time}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <footer className="mt-10 text-center text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70">
          Prayer of the dawn · صلاة الفجر
          <p className="mt-2 normal-case tracking-normal">
            ✍️ Created with care by Hanna Amari
          </p>
        </footer>
      </div>
    </main>
  );
}

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-6xl font-medium leading-none tabular-nums gold-shimmer">
        {value}
      </span>
      <span className="mt-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function fmtTime(sec: number) {
  if (!isFinite(sec)) return "--:--";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${pad(s)}`;
}
