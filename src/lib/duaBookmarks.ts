// Device-local bookmarks for duas. Stores an array of dua ids.

const KEY = "haya-dua-bookmarks-v1";

export function getDuaBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function isDuaBookmarked(id: string): boolean {
  return getDuaBookmarks().includes(id);
}

export function toggleDuaBookmark(id: string): string[] {
  const current = getDuaBookmarks();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full or unavailable — ignore
  }
  return next;
}
