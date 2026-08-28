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
      if (prev && prev.ayah === entry.ayah && prev.totalAyahs === entry.totalAyahs) return;
      save({ ...map, [String(entry.surah)]: { ...entry, updatedAt: Date.now() } });
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
