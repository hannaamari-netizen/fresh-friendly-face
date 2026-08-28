/**
 * Per-version "What's New" acknowledgment tracking.
 *
 * Each app version gets its own acknowledgment record so a future release
 * (e.g. 1.3) correctly shows the banner/screen again even though 1.2 was read.
 * Records are stored device-locally in localStorage.
 */

export const WHATS_NEW_CURRENT_VERSION = "1.2.0";

/** Legacy key from the first single-version implementation. */
const LEGACY_SEEN_KEY = "haya-whats-new-seen";
const ACKS_KEY = "haya-whats-new-acks";

export interface WhatsNewAck {
  version: string;
  status: "read";
  seenAt: string; // ISO timestamp
}

type AckMap = Record<string, WhatsNewAck>;

function readMap(): AckMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ACKS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: AckMap = {};
    for (const [version, value] of Object.entries(parsed as Record<string, unknown>)) {
      const v = value as Partial<WhatsNewAck> | null;
      if (v && v.status === "read" && typeof v.seenAt === "string") {
        out[version] = { version, status: "read", seenAt: v.seenAt };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeMap(map: AckMap): void {
  try {
    window.localStorage.setItem(ACKS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** All acknowledged versions, newest first. */
export function getWhatsNewAcks(): WhatsNewAck[] {
  return Object.values(readMap()).sort((a, b) => b.seenAt.localeCompare(a.seenAt));
}

export function getWhatsNewAck(version: string): WhatsNewAck | null {
  const map = readMap();
  if (map[version]) return map[version];
  // Backwards compatibility: the legacy key only stored the version string.
  try {
    if (
      typeof window !== "undefined" &&
      window.localStorage.getItem(LEGACY_SEEN_KEY) === version
    ) {
      // Migrate the legacy flag into the per-version map (timestamp unknown).
      return acknowledgeWhatsNewVersion(version);
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function isWhatsNewVersionRead(version: string): boolean {
  return getWhatsNewAck(version) !== null;
}

/** Mark a version as read. Idempotent — keeps the original timestamp. */
export function acknowledgeWhatsNewVersion(
  version: string = WHATS_NEW_CURRENT_VERSION,
): WhatsNewAck {
  const map = readMap();
  if (!map[version]) {
    map[version] = { version, status: "read", seenAt: new Date().toISOString() };
    writeMap(map);
    try {
      window.localStorage.setItem(LEGACY_SEEN_KEY, version);
    } catch {
      /* ignore */
    }
  }
  return map[version];
}
