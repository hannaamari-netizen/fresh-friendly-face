/**
 * Local (device-only) Quran bookmarks and reading progress.
 *
 * Everything is stored in localStorage so it works offline and needs no
 * account. Both stores emit a window event so open pages stay in sync.
 */
import { useCallback, useEffect, useState } from "react";

const BOOKMARKS_KEY = "haya.quran.bookmarks.v1";
const PROGRESS_KEY = "haya.quran.progress.v1";
const EVENT = "haya:quran-storage";

export type Bookmark = {
  surah: number;
  ayah: number;
  surahName: string;
  createdAt: number;
};

export type SurahProgress = {
  surah: number;
  ayah: number;
  /** Furthest verse ever reached in this surah (used for the verses-read stat). */
  maxAyah?: number;
  totalAyahs: number;
  surahName: string;
  updatedAt: number;
};

type ProgressMap = Record<string, SurahProgress>;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage full or blocked — progress is a nice-to-have */
  }
}

function useStored<T>(key: string, fallback: T) {
  // Start from the fallback so SSR and the first client render agree.
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setValue(read<T>(key, fallback));
    sync();
    setReady(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { value, ready, save: (next: T) => (write(key, next), setValue(next)) };
}

export function useBookmarks() {
  const { value: bookmarks, ready, save } = useStored<Bookmark[]>(BOOKMARKS_KEY, []);

  const isBookmarked = useCallback(
    (surah: number, ayah: number) => bookmarks.some((b) => b.surah === surah && b.ayah === ayah),
    [bookmarks]
  );

  const toggle = useCallback(
    (surah: number, ayah: number, surahName: string) => {
      const exists = bookmarks.some((b) => b.surah === surah && b.ayah === ayah);
      save(
        exists
          ? bookmarks.filter((b) => !(b.surah === surah && b.ayah === ayah))
          : [{ surah, ayah, surahName, createdAt: Date.now() }, ...bookmarks]
      );
    },
    [bookmarks, save]
  );

  const remove = useCallback(
    (surah: number, ayah: number) =>
      save(bookmarks.filter((b) => !(b.surah === surah && b.ayah === ayah))),
    [bookmarks, save]
  );

  const clear = useCallback(() => save([]), [save]);

  return { bookmarks, ready, isBookmarked, toggle, remove, clear };
}

export function useReadingProgress() {
  const { value: map, ready, save } = useStored<ProgressMap>(PROGRESS_KEY, {});

  const record = useCallback(
    (entry: Omit<SurahProgress, "updatedAt">) => {
      const prev = map[String(entry.surah)];
      // Ignore no-op writes so scrolling doesn't thrash storage.
      const maxAyah = Math.max(entry.ayah, prev?.maxAyah ?? prev?.ayah ?? 0);
      if (prev && prev.ayah === entry.ayah && prev.maxAyah === maxAyah && prev.totalAyahs === entry.totalAyahs)
        return;
      save({ ...map, [String(entry.surah)]: { ...entry, maxAyah, updatedAt: Date.now() } });
    },
    [map, save]
  );

  const forSurah = useCallback((surah: number) => map[String(surah)], [map]);

  const recent = Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
  const last = recent[0];

  const clear = useCallback(() => save({}), [save]);

  return { progress: map, ready, record, forSurah, recent, last, clear };
}

export function percentRead(p: SurahProgress) {
  if (!p.totalAyahs) return 0;
  return Math.min(100, Math.round((p.ayah / p.totalAyahs) * 100));
}

/* ------------------------------------------------------------------ *
 * Reading streak, time spent and totals
 * ------------------------------------------------------------------ */

const STATS_KEY = "haya.quran.stats.v1";

export type QuranStats = {
  /** Seconds spent reading, keyed by local date (YYYY-MM-DD). */
  days: Record<string, number>;
  lastSession: number | null;
};

const EMPTY_STATS: QuranStats = { days: {}, lastSession: null };

export function dayKey(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDay(key: string, delta: number) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y!, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + delta);
  return dayKey(dt);
}

/** Consecutive days ending today (or yesterday, if today has no session yet). */
export function streakFrom(days: Record<string, number>) {
  const today = dayKey();
  let cursor = days[today] ? today : shiftDay(today, -1);
  if (!days[cursor]) return 0;
  let n = 0;
  while (days[cursor]) {
    n += 1;
    cursor = shiftDay(cursor, -1);
  }
  return n;
}

export function useQuranStats() {
  const { value: stats, ready, save } = useStored<QuranStats>(STATS_KEY, EMPTY_STATS);

  /** Add reading time to today's total (called on a heartbeat while reading). */
  const addSeconds = useCallback(
    (seconds: number) => {
      if (seconds <= 0) return;
      const current = read<QuranStats>(STATS_KEY, EMPTY_STATS);
      const key = dayKey();
      save({
        days: { ...current.days, [key]: Math.round((current.days[key] ?? 0) + seconds) },
        lastSession: Date.now(),
      });
    },
    [save]
  );

  const totalSeconds = Object.values(stats.days).reduce((a, b) => a + b, 0);
  const streak = streakFrom(stats.days);
  const daysRead = Object.keys(stats.days).length;
  const todaySeconds = stats.days[dayKey()] ?? 0;

  const clear = useCallback(() => save(EMPTY_STATS), [save]);

  return { stats, ready, addSeconds, totalSeconds, todaySeconds, streak, daysRead, clear };
}

/** Verses read = sum of the furthest verse reached in every surah. */
export function versesRead(progress: Record<string, SurahProgress>) {
  return Object.values(progress).reduce((sum, p) => sum + Math.max(p.maxAyah ?? p.ayah, 0), 0);
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

/* ------------------------------------------------------------------ *
 * Export / import (move data between devices)
 * ------------------------------------------------------------------ */

export type QuranBackup = {
  app: "haya-al-salat";
  kind: "quran-data";
  version: 1;
  exportedAt: string;
  bookmarks: Bookmark[];
  progress: ProgressMap;
  stats: QuranStats;
};

export function buildBackup(): QuranBackup {
  return {
    app: "haya-al-salat",
    kind: "quran-data",
    version: 1,
    exportedAt: new Date().toISOString(),
    bookmarks: read<Bookmark[]>(BOOKMARKS_KEY, []),
    progress: read<ProgressMap>(PROGRESS_KEY, {}),
    stats: read<QuranStats>(STATS_KEY, EMPTY_STATS),
  };
}

/** Download the backup as a .json file. */
export function downloadBackup() {
  const data = buildBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `haya-quran-backup-${dayKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export type ImportResult = { bookmarks: number; surahs: number; days: number };

/**
 * Merge a backup into this device: bookmarks are de-duplicated, per-surah
 * progress keeps the furthest position, and reading time keeps the larger
 * value for each day. Nothing is lost on either side.
 */
export function importBackup(raw: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  const b = parsed as Partial<QuranBackup>;
  if (!b || b.app !== "haya-al-salat" || b.kind !== "quran-data") {
    throw new Error("That file isn't a Haya Al-Salat Quran backup.");
  }

  // Bookmarks
  const current = read<Bookmark[]>(BOOKMARKS_KEY, []);
  const seen = new Set(current.map((x) => `${x.surah}:${x.ayah}`));
  const added = (b.bookmarks ?? []).filter(
    (x) => x && typeof x.surah === "number" && typeof x.ayah === "number" && !seen.has(`${x.surah}:${x.ayah}`)
  );
  const mergedBookmarks = [...added, ...current].sort((x, y) => y.createdAt - x.createdAt);
  write(BOOKMARKS_KEY, mergedBookmarks);

  // Progress
  const curProgress = read<ProgressMap>(PROGRESS_KEY, {});
  const mergedProgress: ProgressMap = { ...curProgress };
  let surahs = 0;
  for (const [key, incoming] of Object.entries(b.progress ?? {})) {
    if (!incoming || typeof incoming.surah !== "number") continue;
    const mine = mergedProgress[key];
    if (!mine || incoming.updatedAt > mine.updatedAt) {
      mergedProgress[key] = {
        ...incoming,
        maxAyah: Math.max(incoming.maxAyah ?? incoming.ayah, mine?.maxAyah ?? mine?.ayah ?? 0),
      };
      surahs += 1;
    } else {
      mergedProgress[key] = {
        ...mine,
        maxAyah: Math.max(mine.maxAyah ?? mine.ayah, incoming.maxAyah ?? incoming.ayah),
      };
    }
  }
  write(PROGRESS_KEY, mergedProgress);

  // Stats
  const curStats = read<QuranStats>(STATS_KEY, EMPTY_STATS);
  const days = { ...curStats.days };
  let dayCount = 0;
  for (const [key, seconds] of Object.entries(b.stats?.days ?? {})) {
    if (typeof seconds !== "number") continue;
    if ((days[key] ?? 0) < seconds) dayCount += 1;
    days[key] = Math.max(days[key] ?? 0, seconds);
  }
  write(STATS_KEY, {
    days,
    lastSession: Math.max(curStats.lastSession ?? 0, b.stats?.lastSession ?? 0) || null,
  });

  return { bookmarks: added.length, surahs, days: dayCount };
}
