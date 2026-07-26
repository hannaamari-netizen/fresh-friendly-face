import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const payloadSchema = z.object({
  deviceToken: z.string().uuid(),
  endpoint: z.string().url().max(2048),
  p256dh: z.string().min(1).max(256),
  auth: z.string().min(1).max(64),
  timezone: z.string().min(1).max(64),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  offsetMinutes: z.number().int().min(1).max(240),
  messageTemplate: z.string().min(1).max(280),
  title: z.string().min(1).max(80).optional(),
  calcMethod: z.number().int().min(0).max(20).optional(),
});

async function fetchNextFajrUtc(
  lat: number | null,
  lon: number | null,
  timezone: string,
  method: number,
): Promise<string | null> {
  try {
    const useLat = lat ?? 21.4225;
    const useLon = lon ?? 39.8262;
    // Ask Aladhan for today + tomorrow; pick whichever fajr is in the future.
    const now = new Date();
    const url = (d: Date) =>
      `https://api.aladhan.com/v1/timings/${Math.floor(d.getTime() / 1000)}?latitude=${useLat}&longitude=${useLon}&method=${method}`;
    const [today, tomorrow] = await Promise.all([
      fetch(url(now)).then((r) => r.json()),
      fetch(url(new Date(now.getTime() + 24 * 3600 * 1000))).then((r) => r.json()),
    ]);
    const parse = (payload: any): Date | null => {
      const tstr: string | undefined = payload?.data?.timings?.Fajr;
      const dstr: string | undefined = payload?.data?.date?.gregorian?.date; // DD-MM-YYYY
      if (!tstr || !dstr) return null;
      const [dd, mm, yyyy] = dstr.split("-");
      const iso = `${yyyy}-${mm}-${dd}T${tstr.slice(0, 5)}:00`;
      // Interpret iso as wall-clock in `timezone`; approximate by computing offset now.
      const d = new Date(iso + "Z");
      // Adjust: we want the wall-clock in timezone. Use Intl offset trick.
      try {
        const dtf = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone, hour12: false,
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        });
        // find UTC time whose formatted value in tz == iso
        // Simple approach: compute tz offset at the iso instant
        const [yy, mo, da] = [yyyy, mm, dd].map(Number);
        const [hh, mi] = tstr.split(":").map(Number);
        const utcGuess = Date.UTC(yy, mo - 1, da, hh, mi, 0);
        const parts = dtf.formatToParts(new Date(utcGuess));
        const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
        const asTz = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), 0);
        const offsetMs = asTz - utcGuess;
        return new Date(utcGuess - offsetMs);
      } catch {
        return d;
      }
    };
    const candidates = [parse(today), parse(tomorrow)].filter((x): x is Date => !!x);
    const future = candidates.find((d) => d.getTime() > now.getTime() + 60_000);
    return (future ?? candidates[candidates.length - 1] ?? null)?.toISOString() ?? null;
  } catch {
    return null;
  }
}

export const savePushSubscription = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => payloadSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nextFajr = await fetchNextFajrUtc(
      data.latitude,
      data.longitude,
      data.timezone,
      data.calcMethod ?? 2,
    );
    const { error } = await supabaseAdmin
      .from("push_subscriptions" as never)
      .upsert(
        {
          device_token: data.deviceToken,
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          timezone: data.timezone,
          latitude: data.latitude,
          longitude: data.longitude,
          offset_minutes: data.offsetMinutes,
          message_template: data.messageTemplate,
          title: data.title ?? "Haya Al-Salat",
          calc_method: data.calcMethod ?? 2,
          next_fajr_utc: nextFajr,
          failure_count: 0,
        } as never,
        { onConflict: "device_token" } as never,
      );
    if (error) throw new Error(error.message);
    return { ok: true, nextFajrUtc: nextFajr };
  });

export const deletePushSubscription = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ deviceToken: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("push_subscriptions" as never)
      .delete()
      .eq("device_token", data.deviceToken);
    return { ok: true };
  });
