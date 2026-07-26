import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, MapPin, Moon, Sunrise, Volume2, VolumeX, Download, CheckCircle2, Loader2, Wifi, BatteryCharging, Radio, Square } from "lucide-react";
import { FajrReminder } from "@/components/FajrReminder";
import { SplashScreen } from "@/components/SplashScreen";
import { MotionToggle } from "@/components/MotionToggle";
import { InstallSteps } from "@/components/InstallSteps";
import { ShareApp } from "@/components/ShareApp";
import { useOfflineAudio } from "@/hooks/useOfflineAudio";
import { useAutoDownload } from "@/hooks/useAutoDownload";
import { todayInZone, zonedDateTimeToUtc } from "@/lib/timezone";


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

// Adhan (call to prayer) audio. Fajr uses the special Fajr adhan which includes
// "As-salatu khayrun min an-nawm" (prayer is better than sleep).
const ADHAN_FAJR_URL = "https://www.islamcan.com/audio/adhan/azan2.mp3";
const ADHAN_URL = "https://www.islamcan.com/audio/adhan/azan1.mp3";

type Timings = {
  Fajr: string; Sunrise: string; Dhuhr: string; Asr: string; Maghrib: string; Isha: string;
};

type LocInfo = { city: string; country: string; lat: number; lon: number; tz: string } | null;

function pad(n: number) { return n.toString().padStart(2, "0"); }

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
  const adhanRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [adhanPlaying, setAdhanPlaying] = useState<string | null>(null);
  const [adhanVolume, setAdhanVolume] = useState<number>(() => {
    if (typeof window === "undefined") return 0.8;
    const raw = localStorage.getItem("haya-adhan-volume");
    const v = raw ? Number(raw) : NaN;
    return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 0.8;
  });
  useEffect(() => {
    try { localStorage.setItem("haya-adhan-volume", String(adhanVolume)); } catch {}
    if (adhanRef.current) adhanRef.current.volume = adhanVolume;
  }, [adhanVolume]);
  const [recitationLead, setRecitationLead] = useState<number>(() => {
    if (typeof window === "undefined") return 10;
    const raw = localStorage.getItem("haya-recitation-lead");
    const v = raw ? Number(raw) : NaN;
    return Number.isFinite(v) && v >= 1 && v <= 60 ? Math.round(v) : 10;
  });
  useEffect(() => {
    try { localStorage.setItem("haya-recitation-lead", String(recitationLead)); } catch {}
  }, [recitationLead]);

  // Configurable snooze duration for the recitation player.
  const [snoozeDuration, setSnoozeDuration] = useState<number>(() => {
    if (typeof window === "undefined") return 5;
    const raw = localStorage.getItem("haya-snooze-duration");
    const v = raw ? Number(raw) : NaN;
    return [5, 10, 15, 30].includes(v) ? v : 5;
  });
  useEffect(() => {
    try { localStorage.setItem("haya-snooze-duration", String(snoozeDuration)); } catch {}
  }, [snoozeDuration]);

  // Desktop notification when Surat Al-Mu'minun auto-starts before Fajr.
  const [notifyOnStart, setNotifyOnStart] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("haya-notify-recitation-start") === "1";
  });
  useEffect(() => {
    try {
      localStorage.setItem("haya-notify-recitation-start", notifyOnStart ? "1" : "0");
    } catch {}
  }, [notifyOnStart]);
  const notifSupported = typeof window !== "undefined" && "Notification" in window;
  const notifyRecitationStart = useCallback(async () => {
    if (!notifyOnStart || !notifSupported) return;
    if (Notification.permission !== "granted") return;
    const title = "Haya Al-Salat";
    const body = "Surat Al-Mu'minun is now playing before Fajr.";
    const options: NotificationOptions = {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "haya-recitation-start",
    };
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) { await reg.showNotification(title, options); return; }
      }
      new Notification(title, options);
    } catch {}
  }, [notifyOnStart, notifSupported]);
  async function enableStartNotifications() {
    if (!notifSupported) return;
    let perm = Notification.permission;
    if (perm === "default") {
      try { perm = await Notification.requestPermission(); } catch {}
    }
    if (perm === "granted") setNotifyOnStart(true);
  }

  // Configurable volume fade-in for the recitation audio, used when it starts
  // automatically at the scheduled time. 0 = disabled (start at full volume).
  const [fadeInMs, setFadeInMs] = useState<number>(() => {
    if (typeof window === "undefined") return 2000;
    const raw = localStorage.getItem("haya-fade-in-ms");
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) && n >= 0 && n <= 10000 ? n : 2000;
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("haya-fade-in-ms", String(fadeInMs));
    }
  }, [fadeInMs]);
  const fadeTimerRef = useRef<number | null>(null);
  const fadeInRecitation = useCallback((durationMs?: number, target = 1) => {
    const el = audioRef.current;
    if (!el) return;
    if (fadeTimerRef.current !== null) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    const dur = durationMs ?? fadeInMs;
    if (!dur || dur <= 0) {
      el.volume = target;
      return;
    }
    el.volume = 0;
    const start = performance.now();
    fadeTimerRef.current = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / dur);
      // ease-out cubic for a gentle rise
      const eased = 1 - Math.pow(1 - t, 3);
      el.volume = Math.max(0, Math.min(1, eased * target));
      if (t >= 1 && fadeTimerRef.current !== null) {
        clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
        el.volume = target;
      }
    }, 50);
  }, [fadeInMs]);
  useEffect(() => () => {
    if (fadeTimerRef.current !== null) clearInterval(fadeTimerRef.current);
  }, []);



  // Audio auto-play unlock. Browsers block programmatic play() without a
  // prior user gesture, so show a prompt until the user taps once. On tap,
  // we call play()+pause() on both audio elements to "unlock" the tab.
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("haya-audio-unlocked") === "1";
  });
  const unlockAudio = useCallback(async () => {
    const els = [audioRef.current, adhanRef.current].filter(Boolean) as HTMLAudioElement[];
    for (const el of els) {
      const prevMuted = el.muted;
      const prevSrc = el.src;
      try {
        el.muted = true;
        if (!el.src) el.src = SURAH_URL; // needs a src to play
        await el.play();
        el.pause();
        el.currentTime = 0;
      } catch {
        // ignore — user gesture still lets subsequent play() work
      } finally {
        el.muted = prevMuted;
        if (!prevSrc && el === adhanRef.current) el.removeAttribute("src");
      }
    }
    try { sessionStorage.setItem("haya-audio-unlocked", "1"); } catch {}
    setAudioUnlocked(true);
  }, []);
  const offline = useOfflineAudio(SURAH_URL);
  const auto = useAutoDownload({
    isCached: offline.status === "cached",
    isDownloading: offline.status === "downloading",
    triggerDownload: offline.download,
  });
  // Streaming-first: start with the network URL, swap to the offline blob only
  // when playback is idle so an in-flight stream is never interrupted.
  const [activeSrc, setActiveSrc] = useState<string>(SURAH_URL);

  // Fetch location + prayer times (timezone-aware, refetches on day rollover / focus)
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);
  const [fetchTick, setFetchTick] = useState(0);

  const load = useCallback(async (lat: number, lon: number) => {
    // Use the *device* current date as a starting query; the API returns the
    // correct set for the coordinates' timezone even if the date differs by a day.
    const d = new Date();
    const date = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    try {
      const res = await fetch(
        `https://api.aladhan.com/v1/timings/${date}?latitude=${lat}&longitude=${lon}&method=2`
      );
      const j = await res.json();
      const m = j.data.meta;
      const tz: string = m.timezone;
      // If the location's local date differs from device date, re-query with the
      // location's calendar day so prayer times match the user's actual day.
      const zoneToday = todayInZone(tz);
      const zoneDateStr = `${pad(zoneToday.d)}-${pad(zoneToday.m)}-${zoneToday.y}`;
      let timings = j.data.timings;
      if (zoneDateStr !== date) {
        const res2 = await fetch(
          `https://api.aladhan.com/v1/timings/${zoneDateStr}?latitude=${lat}&longitude=${lon}&method=2`
        );
        const j2 = await res2.json();
        timings = j2.data.timings;
      }
      setTimings(timings);
      setLoc({
        city: tz.split("/").pop()?.replace(/_/g, " ") ?? "Your city",
        country: "",
        lat: m.latitude,
        lon: m.longitude,
        tz,
      });
      setError(null);
      setLoading(false);
    } catch {
      setError("Couldn't fetch prayer times.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const use = (lat: number, lon: number) => {
      if (cancelled) return;
      coordsRef.current = { lat, lon };
      load(lat, lon);
    };
    if (!navigator.geolocation) {
      use(21.4225, 39.8262); // Mecca fallback
      return () => { cancelled = true; };
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => use(pos.coords.latitude, pos.coords.longitude),
      () => use(21.4225, 39.8262),
      { timeout: 5000 }
    );
    return () => { cancelled = true; };
  }, [load, fetchTick]);

  // Refetch on tab focus (handles device travel + wake-from-sleep) and hourly
  // (handles DST transitions + day rollover mid-session).
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") setFetchTick((t) => t + 1);
    };
    document.addEventListener("visibilitychange", onVis);
    const hourly = window.setInterval(() => setFetchTick((t) => t + 1), 60 * 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(hourly);
    };
  }, []);

  // Refetch when the local-zone calendar day changes (crosses midnight).
  const zoneDayKey = loc?.tz ? (() => { const t = todayInZone(loc.tz); return `${t.y}-${t.m}-${t.d}`; })() : "";
  useEffect(() => {
    if (loc?.tz && coordsRef.current) load(coordsRef.current.lat, coordsRef.current.lon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneDayKey]);

  // Resolve a prayer HH:MM string to an absolute UTC Date in the location's tz.
  const resolvePrayerInstant = useCallback(
    (hhmm: string): Date | null => {
      if (!loc?.tz) return null;
      const t = todayInZone(loc.tz);
      return zonedDateTimeToUtc(t.y, t.m, t.d, hhmm, loc.tz);
    },
    [loc?.tz]
  );

  // Compute Fajr countdown (timezone-aware)
  const fajrInfo = useMemo(() => {
    if (!timings || !loc?.tz) return null;
    let fajr = resolvePrayerInstant(timings.Fajr);
    if (!fajr) return null;
    if (fajr.getTime() < now.getTime()) {
      // Compute tomorrow's Fajr in the location's zone.
      const t = todayInZone(loc.tz);
      const tomorrowUtc = zonedDateTimeToUtc(t.y, t.m, t.d + 1, timings.Fajr, loc.tz);
      fajr = tomorrowUtc;
    }
    const diff = fajr.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { fajr, h, m, s, diff };
  }, [timings, now, loc?.tz, resolvePrayerInstant]);

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

  // Determine which prayer is next (timezone-aware)
  const nextPrayerKey = useMemo(() => {
    if (!timings || !loc?.tz) return "Fajr";
    const order: (keyof Timings)[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    for (const k of order) {
      const instant = resolvePrayerInstant(timings[k]);
      if (instant && instant.getTime() > now.getTime()) return k;
    }
    return "Fajr";
  }, [timings, now, loc?.tz, resolvePrayerInstant]);

  const [snoozeUntil, setSnoozeUntil] = useState<number | null>(null);

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      // Manual play cancels any pending snooze.
      setSnoozeUntil(null);
      // Stop adhan if it's playing so the two audios don't overlap.
      if (adhanRef.current && !adhanRef.current.paused) {
        try { adhanRef.current.pause(); } catch {}
        setAdhanPlaying(null);
      }
      el.play(); setPlaying(true);
    }
    else { el.pause(); setPlaying(false); }
  }

  function snoozeRecitation() {
    const el = audioRef.current;
    if (!el) return;
    try { el.pause(); } catch {}
    setPlaying(false);
    setSnoozeUntil(Date.now() + 5 * 60 * 1000);
  }
  function cancelSnooze() {
    setSnoozeUntil(null);
  }

  // Fully stop the recitation: pause, reset position, cancel any pending
  // snooze, and mark today's auto-start slot as consumed so it won't
  // restart on its own until the next Fajr window.
  function stopRecitation() {
    const el = audioRef.current;
    if (el) {
      try { el.pause(); } catch {}
      try { el.currentTime = 0; } catch {}
    }
    setPlaying(false);
    setSnoozeUntil(null);
    const target = fajrInfo?.fajr ? fajrInfo.fajr.getTime() : null;
    if (target !== null) autoStartedForRef.current = target;
  }


  function toggleAdhan(prayerKey: string) {
    const el = adhanRef.current;
    if (!el) return;
    // Stop surah playback if active.
    if (audioRef.current && !audioRef.current.paused) {
      try { audioRef.current.pause(); } catch {}
      setPlaying(false);
    }
    if (adhanPlaying === prayerKey) {
      try { el.pause(); } catch {}
      setAdhanPlaying(null);
      return;
    }
    const src = prayerKey === "Fajr" ? ADHAN_FAJR_URL : ADHAN_URL;
    el.src = src;
    el.currentTime = 0;
    el.volume = adhanVolume;
    el.play().then(() => setAdhanPlaying(prayerKey)).catch(() => setAdhanPlaying(null));
  }

  // Auto-start Surat Al-Mu'minun `recitationLead` minutes before Fajr, once per Fajr instant.
  // Browsers may block autoplay without a prior user gesture; the app is
  // typically opened at least once, which grants permission for this tab.
  const autoStartedForRef = useRef<number | null>(null);
  useEffect(() => {
    if (!fajrInfo) return;
    const el = audioRef.current;
    if (!el) return;
    const target = fajrInfo.fajr.getTime();
    const msBefore = target - now.getTime();
    // Window: from `recitationLead` min before Fajr up to Fajr itself.
    if (msBefore <= recitationLead * 60 * 1000 && msBefore > 0) {
      if (autoStartedForRef.current === target) return;
      if (!el.paused) return; // already playing
      if (snoozeUntil && Date.now() < snoozeUntil) return; // user snoozed
      // Stop any adhan first.
      if (adhanRef.current && !adhanRef.current.paused) {
        try { adhanRef.current.pause(); } catch {}
        setAdhanPlaying(null);
      }
      autoStartedForRef.current = target;
      // Start silent, then ramp volume up over ~2s for a gentle entrance.
      el.volume = 0;
      el.play().then(() => {
        setPlaying(true);
        fadeInRecitation();
        notifyRecitationStart();
      }).catch(() => {
        // Autoplay blocked — leave state as-is; user can tap play.
        el.volume = 1;
      });
    }
  }, [fajrInfo, now, recitationLead, snoozeUntil, notifyRecitationStart, fadeInRecitation]);

  // Auto-resume Surat when the 5-minute snooze elapses.
  useEffect(() => {
    if (!snoozeUntil) return;
    if (now.getTime() < snoozeUntil) return;
    setSnoozeUntil(null);
    // Stop adhan if playing, then resume Surat.
    if (adhanRef.current && !adhanRef.current.paused) {
      try { adhanRef.current.pause(); } catch {}
      setAdhanPlaying(null);
    }
    const el = audioRef.current;
    if (el && el.paused) {
      el.volume = 0;
      el.play().then(() => {
        setPlaying(true);
        fadeInRecitation();
        notifyRecitationStart();
      }).catch(() => {
        // Autoplay blocked — user can tap play.
        el.volume = 1;
      });
    }
  }, [now, snoozeUntil, notifyRecitationStart, fadeInRecitation]);

  // Prefer the offline blob, but only swap when playback is idle so a stream
  // in progress plays through uninterrupted. On next play, the local copy is used.
  useEffect(() => {
    if (!offline.localUrl) return;
    if (activeSrc === offline.localUrl) return;
    if (playing) return; // don't yank an active stream
    const el = audioRef.current;
    const currentTime = el?.currentTime ?? 0;
    setActiveSrc(offline.localUrl);
    // Preserve position if the user paused mid-stream.
    if (el && currentTime > 0) {
      const restore = () => {
        try { el.currentTime = currentTime; } catch {}
        el.removeEventListener("loadedmetadata", restore);
      };
      el.addEventListener("loadedmetadata", restore);
    }
  }, [offline.localUrl, playing, activeSrc]);

  // If the cache is cleared while paused, revert to the network URL.
  useEffect(() => {
    if (!offline.localUrl && activeSrc !== SURAH_URL && !playing) {
      setActiveSrc(SURAH_URL);
    }
  }, [offline.localUrl, activeSrc, playing]);

  // Media Session — lock screen / notification shade controls & metadata
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({
      title: "Surat Al-Mu'minun — سورة المؤمنون",
      artist: "Mukhtar Al-Hajj — مختار الحاج",
      album: "Haya Al-Salat · Peaceful Fajr Companion",
      artwork: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    });

    const el = () => audioRef.current;
    const safe = (fn: () => void) => { try { fn(); } catch { /* ignore */ } };

    ms.setActionHandler("play", () => {
      const a = el(); if (!a) return;
      a.play().then(() => setPlaying(true)).catch(() => {});
    });
    ms.setActionHandler("pause", () => {
      const a = el(); if (!a) return;
      safe(() => a.pause()); setPlaying(false);
    });
    ms.setActionHandler("seekbackward", (d) => {
      const a = el(); if (!a) return;
      a.currentTime = Math.max(0, a.currentTime - (d.seekOffset || 10));
    });
    ms.setActionHandler("seekforward", (d) => {
      const a = el(); if (!a) return;
      a.currentTime = Math.min(a.duration || a.currentTime, a.currentTime + (d.seekOffset || 10));
    });
    ms.setActionHandler("seekto", (d) => {
      const a = el(); if (!a || d.seekTime == null) return;
      if (d.fastSeek && "fastSeek" in a) (a as any).fastSeek(d.seekTime);
      else a.currentTime = d.seekTime;
    });
    // Single-track recitation: previous restarts, next replays from the beginning.
    ms.setActionHandler("previoustrack", () => {
      const a = el(); if (!a) return;
      a.currentTime = 0;
    });
    ms.setActionHandler("nexttrack", () => {
      const a = el(); if (!a) return;
      a.currentTime = 0;
      a.play().then(() => setPlaying(true)).catch(() => {});
    });

    return () => {
      ["play","pause","seekbackward","seekforward","seekto","previoustrack","nexttrack"].forEach((k) => {
        try { ms.setActionHandler(k as MediaSessionAction, null); } catch {}
      });
    };
  }, []);

  // Keep OS playback state & position in sync so the lock screen scrubber is accurate.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [playing]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!("setPositionState" in navigator.mediaSession)) return;
    if (!duration || !Number.isFinite(duration)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.min(progress, duration),
        playbackRate: audioRef.current?.playbackRate || 1,
      });
    } catch { /* ignore */ }
  }, [progress, duration]);


  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden safe-px">
      <SplashScreen />
      <Stars />

      {!audioUnlocked && (
        <div
          className="fixed inset-x-0 z-50 flex justify-center px-4"
          style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          role="dialog"
          aria-live="polite"
        >
          <button
            type="button"
            onClick={unlockAudio}
            className="group flex w-full max-w-sm items-center gap-3 rounded-2xl border border-amber-200/30 bg-[#0b0a1a]/90 px-4 py-3 text-left shadow-2xl backdrop-blur transition hover:border-amber-200/60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200/15 text-amber-100 text-lg">
              🔔
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium text-amber-50">Tap to enable audio</span>
              <span className="block text-xs text-amber-100/70">
                Required so the Adhan and Surat Al-Mu'minun can auto-play before Fajr.
              </span>
            </span>
            <span className="text-xs font-semibold text-amber-200 group-hover:text-amber-100">Enable</span>
          </button>
        </div>
      )}



      {/* Moon glow */}
      <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full float-slow"
           style={{ background: "radial-gradient(circle, oklch(0.9 0.05 90 / 0.35), transparent 70%)" }} />

      <div
        className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-6"
        style={{
          paddingTop: "calc(2.5rem + env(safe-area-inset-top))",
          paddingBottom: "calc(3rem + env(safe-area-inset-bottom))",
        }}
      >
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
              {(() => {
                const recMs = fajrInfo.diff - recitationLead * 60 * 1000;
                if (recMs > 0) {
                  const rh = Math.floor(recMs / 3600000);
                  const rm = Math.floor((recMs % 3600000) / 60000);
                  const rs = Math.floor((recMs % 60000) / 1000);
                  const label = rh > 0 ? `${rh}h ${pad(rm)}m ${pad(rs)}s` : `${rm}m ${pad(rs)}s`;
                  return (
                    <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] text-muted-foreground">
                      <Play className="h-3 w-3" style={{ color: "var(--gold)" }} />
                      <span>Surat Al-Mu'minun begins in</span>
                      <span className="tabular-nums font-medium" style={{ color: "var(--gold)" }}>{label}</span>
                    </div>
                  );
                }
                if (fajrInfo.diff > 0) {
                  return (
                    <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-[var(--gold)]/40 bg-[oklch(0.82_0.13_85/0.12)] px-3 py-2 text-[11px]" style={{ color: "var(--gold)" }}>
                      <Play className="h-3 w-3" />
                      <span>Surat Al-Mu'minun is reciting now — {Math.max(1, Math.ceil(fajrInfo.diff / 60000))} min to Fajr</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </section>


        {/* Fajr reminder */}
        <section className="mt-6">
          <FajrReminder
            fajrDate={fajrInfo?.fajr ?? null}
            timezone={loc?.tz ?? null}
            latitude={loc?.lat ?? null}
            longitude={loc?.lon ?? null}
          />
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

            {/* Snooze */}
            {snoozeUntil ? (
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-amber-200/20 bg-amber-200/5 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-amber-200/80">Snoozed</p>
                  <p className="text-sm tabular-nums text-amber-50">
                    Resumes in {fmtTime(Math.max(0, Math.ceil((snoozeUntil - now.getTime()) / 1000)))}
                  </p>
                </div>
                <button
                  onClick={cancelSnooze}
                  className="rounded-full border border-amber-200/30 px-3 py-1 text-xs text-amber-100 transition hover:bg-amber-200/10"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={snoozeRecitation}
                  disabled={!playing}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Snooze 5 min
                </button>
                <button
                  onClick={stopRecitation}
                  disabled={!playing && (audioRef.current?.currentTime ?? 0) === 0}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-rose-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Square className="h-3 w-3" fill="currentColor" /> Stop
                </button>
              </div>
            )}


            {/* Progress + seek */}
            <div className="mt-4">
              <div className="relative h-6 w-full">
                {/* Track */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: duration ? `${(progress / duration) * 100}%` : "0%",
                      background: "linear-gradient(90deg, var(--gold), var(--dawn))",
                    }}
                  />
                </div>
                {/* Thumb */}
                {duration ? (
                  <div
                    className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow"
                    style={{
                      left: `${(progress / duration) * 100}%`,
                      background: "var(--gold)",
                      boxShadow: "0 0 0 3px oklch(0.82 0.13 85 / 0.25)",
                    }}
                  />
                ) : null}
                {/* Seek input (transparent, overlays track) */}
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={Math.min(progress, duration || 0)}
                  disabled={!duration}
                  onChange={(e) => {
                    const t = Number(e.currentTarget.value);
                    const el = audioRef.current;
                    if (el && Number.isFinite(t)) {
                      try { el.currentTime = t; } catch {}
                      setProgress(t);
                    }
                  }}
                  aria-label="Seek within recitation"
                  className="haya-seek absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px] tabular-nums text-muted-foreground">
                <span>{fmtTime(progress)}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const el = audioRef.current;
                      if (!el) return;
                      const t = Math.max(0, (el.currentTime || 0) - 10);
                      try { el.currentTime = t; } catch {}
                      setProgress(t);
                    }}
                    disabled={!duration}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-foreground/80 transition hover:bg-white/10 disabled:opacity-40"
                  >
                    −10s
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const el = audioRef.current;
                      if (!el) return;
                      const t = Math.min(el.duration || 0, (el.currentTime || 0) + 10);
                      try { el.currentTime = t; } catch {}
                      setProgress(t);
                    }}
                    disabled={!duration}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-foreground/80 transition hover:bg-white/10 disabled:opacity-40"
                  >
                    +10s
                  </button>
                </div>
                <span>{duration ? fmtTime(duration) : "--:--"}</span>
              </div>
            </div>


            {/* Auto-start lead time before Fajr */}
            <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 px-3 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Start reciting before Fajr
                </p>
                <span className="text-[10px] tabular-nums" style={{ color: "var(--gold)" }}>
                  {recitationLead} min
                </span>
              </div>
              <div className="flex gap-2">
                {[5, 10, 15, 20, 30].map((m) => {
                  const sel = recitationLead === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setRecitationLead(m)}
                      className="flex-1 rounded-full border px-2 py-1.5 text-[11px] font-medium transition"
                      style={{
                        borderColor: sel ? "var(--gold)" : "oklch(1 0 0 / 0.12)",
                        background: sel ? "oklch(0.82 0.13 85 / 0.15)" : "transparent",
                        color: sel ? "var(--gold)" : "var(--foreground)",
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground/80">
                Surat Al-Mu'minun begins {recitationLead} minutes before the Fajr adhan.
              </p>
            </div>

            {/* Fade-in duration */}
            <div className="mt-3 rounded-2xl border border-white/5 bg-black/20 px-3 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Fade-in
                </p>
                <span className="text-[10px] tabular-nums" style={{ color: "var(--gold)" }}>
                  {fadeInMs === 0 ? "Off" : `${(fadeInMs / 1000).toFixed(fadeInMs % 1000 === 0 ? 0 : 1)}s`}
                </span>
              </div>
              <div className="flex gap-2">
                {[
                  { label: "Off", ms: 0 },
                  { label: "1s", ms: 1000 },
                  { label: "2s", ms: 2000 },
                  { label: "4s", ms: 4000 },
                  { label: "6s", ms: 6000 },
                ].map((opt) => {
                  const sel = fadeInMs === opt.ms;
                  return (
                    <button
                      key={opt.ms}
                      onClick={() => setFadeInMs(opt.ms)}
                      className="flex-1 rounded-full border px-2 py-1.5 text-[11px] font-medium transition"
                      style={{
                        borderColor: sel ? "var(--gold)" : "oklch(1 0 0 / 0.12)",
                        background: sel ? "oklch(0.82 0.13 85 / 0.15)" : "transparent",
                        color: sel ? "var(--gold)" : "var(--foreground)",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground/80">
                {fadeInMs === 0
                  ? "Recitation starts at full volume."
                  : `Volume rises gently over ${(fadeInMs / 1000).toFixed(fadeInMs % 1000 === 0 ? 0 : 1)} seconds when it auto-starts.`}
              </p>
            </div>


            {/* Desktop notification when Surat starts */}
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-black/20 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-amber-50">Notify me when it starts</p>
                <p className="text-[10px] text-muted-foreground/80">
                  {!notifSupported
                    ? "Notifications aren't supported on this device."
                    : Notification.permission === "denied"
                    ? "Notifications blocked in browser settings."
                    : notifyOnStart
                    ? "You'll get a desktop alert when Surat Al-Mu'minun starts."
                    : "Get a desktop alert the moment Surat Al-Mu'minun begins."}
                </p>
              </div>
              {notifyOnStart ? (
                <button
                  onClick={() => setNotifyOnStart(false)}
                  className="rounded-full border border-amber-200/30 px-3 py-1 text-[11px] text-amber-100 transition hover:bg-amber-200/10"
                >
                  On
                </button>
              ) : (
                <button
                  onClick={enableStartNotifications}
                  disabled={!notifSupported || (notifSupported && Notification.permission === "denied")}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-amber-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Enable
                </button>
              )}
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

            {/* Auto-download on Wi-Fi & charging */}
            <div className="mt-3 rounded-2xl border border-white/5 bg-black/20 px-3 py-2.5">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium" style={{ color: "var(--gold-soft)" }}>
                    Auto-download when safe
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Save the recitation automatically only on Wi-Fi &amp; while charging — no mobile data used.
                  </p>
                </div>
                <span
                  className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-white/10 transition"
                  style={{
                    background: auto.settings.enabled
                      ? "linear-gradient(140deg, var(--gold), oklch(0.65 0.14 40))"
                      : "rgba(255,255,255,0.08)",
                  }}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={auto.settings.enabled}
                    onChange={(e) => auto.setSettings({ enabled: e.target.checked })}
                    aria-label="Enable auto-download on Wi-Fi and charging"
                  />
                  <span
                    className="absolute h-3.5 w-3.5 rounded-full bg-white transition-transform"
                    style={{ transform: auto.settings.enabled ? "translateX(20px)" : "translateX(3px)" }}
                  />
                </span>
              </label>

              {auto.settings.enabled && (
                <div className="mt-2.5 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => auto.setSettings({ requireWifi: !auto.settings.requireWifi })}
                      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] transition"
                      style={{
                        borderColor: auto.settings.requireWifi ? "var(--gold)" : "rgba(255,255,255,0.12)",
                        color: auto.settings.requireWifi ? "var(--gold)" : "var(--muted-foreground)",
                        background: auto.settings.requireWifi ? "rgba(212,175,55,0.08)" : "transparent",
                      }}
                      aria-pressed={auto.settings.requireWifi}
                    >
                      <Wifi className="h-3 w-3" />
                      Wi-Fi only
                    </button>
                    <button
                      type="button"
                      onClick={() => auto.setSettings({ requireCharging: !auto.settings.requireCharging })}
                      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] transition"
                      style={{
                        borderColor: auto.settings.requireCharging ? "var(--gold)" : "rgba(255,255,255,0.12)",
                        color: auto.settings.requireCharging ? "var(--gold)" : "var(--muted-foreground)",
                        background: auto.settings.requireCharging ? "rgba(212,175,55,0.08)" : "transparent",
                      }}
                      aria-pressed={auto.settings.requireCharging}
                    >
                      <BatteryCharging className="h-3 w-3" />
                      While charging
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {auto.reason === "ready" && "Conditions met — downloading soon."}
                    {auto.reason === "cached" && "Already saved offline."}
                    {auto.reason === "downloading" && "Saving now…"}
                    {auto.reason === "offline" && "Waiting for a connection."}
                    {auto.reason === "not-wifi" && "Waiting for Wi-Fi."}
                    {auto.reason === "wifi-unknown" &&
                      "Your browser can't detect Wi-Fi — turn off Wi-Fi only to allow any network."}
                    {auto.reason === "not-charging" && "Waiting until the device is charging."}
                    {auto.reason === "charging-unknown" &&
                      "Your browser can't detect charging — turn off While charging to auto-save."}
                  </p>
                </div>
              )}
            </div>



            <audio
              ref={audioRef}
              src={activeSrc}
              preload="metadata"
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
              onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
              onPause={() => setPlaying(false)}
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
                  <div className="flex items-center gap-3">
                    <span
                      className="font-display text-lg tabular-nums"
                      style={{ color: isNext ? "var(--gold)" : "var(--foreground)" }}
                    >
                      {p.time}
                    </span>
                    {p.key !== "Sunrise" && (
                      <button
                        type="button"
                        onClick={() => toggleAdhan(p.key)}
                        aria-label={
                          adhanPlaying === p.key
                            ? `Stop ${p.label} Adhan`
                            : `Play ${p.label} Adhan`
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full border transition active:scale-95"
                        style={{
                          borderColor:
                            adhanPlaying === p.key
                              ? "var(--gold)"
                              : "oklch(1 0 0 / 0.12)",
                          background:
                            adhanPlaying === p.key
                              ? "oklch(0.82 0.13 85 / 0.18)"
                              : "transparent",
                          color:
                            adhanPlaying === p.key
                              ? "var(--gold)"
                              : "var(--muted-foreground)",
                        }}
                      >
                        {adhanPlaying === p.key ? (
                          <Square className="h-3.5 w-3.5" />
                        ) : (
                          <Radio className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <audio
            ref={adhanRef}
            preload="none"
            onEnded={() => setAdhanPlaying(null)}
            onPause={() => {
              if (adhanRef.current && adhanRef.current.ended) return;
            }}
          />
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Adhan volume
              </p>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {Math.round(adhanVolume * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAdhanVolume(adhanVolume > 0 ? 0 : 0.8)}
                aria-label={adhanVolume === 0 ? "Unmute Adhan" : "Mute Adhan"}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition hover:text-[var(--gold)]"
              >
                {adhanVolume === 0 ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={adhanVolume}
                onChange={(e) => setAdhanVolume(Number(e.target.value))}
                aria-label="Adhan volume"
                className="haya-slider flex-1"
                style={{ ["--val" as any]: `${adhanVolume * 100}%` }}
              />
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] text-muted-foreground/70">
            Tap the Adhan icon to hear the call to prayer for each time.
          </p>
        </section>

        <section className="mt-8">
          <MotionToggle />
        </section>

        <section className="mt-6">
          <InstallSteps />
        </section>

        <section className="mt-6">
          <ShareApp />
        </section>

        <footer className="mt-10 text-center text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70">
          Prayer of the dawn · صلاة الفجر
          <p className="mt-2 normal-case tracking-normal">
            ✍️ Created with care by Inoxin HA
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
