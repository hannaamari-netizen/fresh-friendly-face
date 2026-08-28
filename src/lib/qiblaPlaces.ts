/**
 * Qibla history and favourite locations, stored on the device (localStorage).
 * Each entry keeps the bearing and distance so it can be revisited instantly,
 * even offline.
 */
import { useCallback, useEffect, useState } from "react";

const HISTORY_KEY = "haya.qibla.history.v1";
const FAVORITES_KEY = "haya.qibla.favorites.v1";
const EVENT = "haya:qibla-storage";
const HISTORY_LIMIT = 12;

export type QiblaPlace = {
  city: string;
  country: string;
  lat: number;
  lon: number;
  bearing: number;
  distanceKm: number;
  savedAt: number;
};

export function placeKey(p: { lat: number; lon: number }) {
  return `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`;
}

function read(key: string): QiblaPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as QiblaPlace[]) : [];
  } catch {
    return [];
  }
}

function write(key: string, value: QiblaPlace[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

function useList(key: string) {
  // Start empty so SSR and the first client render match.
  const [list, setList] = useState<QiblaPlace[]>([]);

  useEffect(() => {
    const sync = () => setList(read(key));
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [key]);

  const save = useCallback(
    (next: QiblaPlace[]) => {
      write(key, next);
      setList(next);
    },
    [key]
  );

  return [list, save] as const;
}

export function useQiblaPlaces() {
  const [history, saveHistory] = useList(HISTORY_KEY);
  const [favorites, saveFavorites] = useList(FAVORITES_KEY);

  const pushHistory = useCallback(
    (p: Omit<QiblaPlace, "savedAt">) => {
      const k = placeKey(p);
      const current = read(HISTORY_KEY);
      if (current[0] && placeKey(current[0]) === k) return;
      saveHistory(
        [{ ...p, savedAt: Date.now() }, ...current.filter((e) => placeKey(e) !== k)].slice(0, HISTORY_LIMIT)
      );
    },
    [saveHistory]
  );

  const isFavorite = useCallback(
    (p: { lat: number; lon: number }) => favorites.some((f) => placeKey(f) === placeKey(p)),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (p: Omit<QiblaPlace, "savedAt">) => {
      const k = placeKey(p);
      const exists = favorites.some((f) => placeKey(f) === k);
      saveFavorites(
        exists
          ? favorites.filter((f) => placeKey(f) !== k)
          : [{ ...p, savedAt: Date.now() }, ...favorites]
      );
    },
    [favorites, saveFavorites]
  );

  const removeFavorite = useCallback(
    (p: { lat: number; lon: number }) => saveFavorites(favorites.filter((f) => placeKey(f) !== placeKey(p))),
    [favorites, saveFavorites]
  );

  const clearHistory = useCallback(() => saveHistory([]), [saveHistory]);

  return { history, favorites, pushHistory, isFavorite, toggleFavorite, removeFavorite, clearHistory };
}
