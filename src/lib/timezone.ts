// Timezone-aware helpers for prayer scheduling.
// The Aladhan API returns HH:MM strings in the *location's* IANA timezone
// (e.g. "Asia/Riyadh"). Interpreting them with `new Date().setHours()` binds
// them to the device's timezone, which drifts after travel or DST changes.
// These helpers produce absolute UTC instants that survive both.

function tzOffsetMs(tz: string, atUtcMs: number): number {
  // Difference between wall time in `tz` and UTC wall time, in ms.
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(atUtcMs));
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) === 24 ? 0 : Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return asUtc - atUtcMs;
}

/**
 * Convert a wall-clock date + HH:MM in an IANA timezone to an absolute UTC Date.
 * `y/m/d` are the calendar date components in that timezone.
 */
export function zonedDateTimeToUtc(
  y: number,
  m: number, // 1-12
  d: number,
  hhmm: string,
  tz: string,
): Date {
  const [h, min] = hhmm.split(":").map(Number);
  // First guess: treat wall time as UTC, then subtract the zone offset at that instant.
  const guess = Date.UTC(y, m - 1, d, h, min, 0);
  let offset = tzOffsetMs(tz, guess);
  let utc = guess - offset;
  // Re-evaluate offset at the corrected instant to catch DST boundaries.
  const offset2 = tzOffsetMs(tz, utc);
  if (offset2 !== offset) utc = guess - offset2;
  return new Date(utc);
}

/** Get the calendar year/month/day currently in the given timezone. */
export function todayInZone(tz: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;
  return { y: Number(map.year), m: Number(map.month), d: Number(map.day) };
}

/** Format a Date as HH:MM in the given timezone (for display consistency). */
export function formatInZone(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
