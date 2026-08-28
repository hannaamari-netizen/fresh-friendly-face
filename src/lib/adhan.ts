// Adhan (call to prayer) audio sources.
//
// IMPORTANT: ADHAN_FAJR_URL is PINNED. The Fajr adhan recording is a
// deliberate product choice and must never change. The safeguard script
// `scripts/check-fajr-adhan.mjs` (run via `bun run check:fajr-adhan` and in
// the iOS preflight) verifies this value before every release.
export const ADHAN_FAJR_URL = "https://www.islamcan.com/audio/adhan/azan2.mp3";

// Regular adhan for Dhuhr, Asr, Maghrib and Isha (high-quality Aladhan CDN).
export const ADHAN_URL = "https://cdn.aladhan.com/audio/adhans/a2.mp3";

export const ADHAN_SOURCES = [ADHAN_FAJR_URL, ADHAN_URL] as const;

/** The phrase traditionally added before the Fajr adhan. */
export const FAJR_PHRASE_ARABIC = "الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ";
export const FAJR_PHRASE_LATIN = "As-salatu khayrun min an-nawm";
export const FAJR_PHRASE_MEANING = "Prayer is better than sleep";

const ADHAN_CACHE = "haya-adhan-v1";

/**
 * Download and cache both adhan recordings in the background so the alert
 * starts instantly when a prayer time arrives, even on a weak connection.
 */
export async function preloadAdhanAudio(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(ADHAN_CACHE);
    for (const url of ADHAN_SOURCES) {
      const hit = await cache.match(url);
      if (hit) continue;
      const res = await fetch(url, { mode: "cors" });
      if (res.ok) await cache.put(url, res);
    }
  } catch {
    /* network unavailable — playback will stream instead */
  }
}

/**
 * Resolve an adhan URL to its cached offline copy (blob URL) when available,
 * otherwise return the original streaming URL.
 */
export async function cachedAdhanSrc(url: string): Promise<string> {
  if (typeof caches === "undefined") return url;
  try {
    const hit = await (await caches.open(ADHAN_CACHE)).match(url);
    if (hit) return URL.createObjectURL(await hit.blob());
  } catch {
    /* fall through to streaming */
  }
  return url;
}
