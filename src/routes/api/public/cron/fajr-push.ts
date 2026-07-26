import { createFileRoute } from "@tanstack/react-router";

// Cron endpoint: called every minute by pg_cron. Finds due Fajr reminders and
// sends web-push notifications, then advances the schedule.

async function fetchNextFajrUtc(
  lat: number | null,
  lon: number | null,
  timezone: string,
  method: number,
  after: Date,
): Promise<string | null> {
  const useLat = lat ?? 21.4225;
  const useLon = lon ?? 39.8262;
  const seconds = Math.floor((after.getTime() + 3600 * 1000) / 1000);
  const url = `https://api.aladhan.com/v1/timings/${seconds}?latitude=${useLat}&longitude=${useLon}&method=${method}`;
  try {
    const [today, tomorrow] = await Promise.all([
      fetch(url).then((r) => r.json()),
      fetch(
        `https://api.aladhan.com/v1/timings/${seconds + 24 * 3600}?latitude=${useLat}&longitude=${useLon}&method=${method}`,
      ).then((r) => r.json()),
    ]);
    const parse = (payload: any): Date | null => {
      const tstr: string | undefined = payload?.data?.timings?.Fajr;
      const dstr: string | undefined = payload?.data?.date?.gregorian?.date;
      if (!tstr || !dstr) return null;
      const [dd, mm, yyyy] = dstr.split("-").map(Number);
      const [hh, mi] = tstr.split(":").map(Number);
      const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone, hour12: false,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });
      const utcGuess = Date.UTC(yyyy, mm - 1, dd, hh, mi, 0);
      const parts = dtf.formatToParts(new Date(utcGuess));
      const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
      const asTz = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), 0);
      const offsetMs = asTz - utcGuess;
      return new Date(utcGuess - offsetMs);
    };
    const candidates = [parse(today), parse(tomorrow)].filter((x): x is Date => !!x);
    const future = candidates.find((d) => d.getTime() > after.getTime() + 60_000);
    return (future ?? candidates[candidates.length - 1] ?? null)?.toISOString() ?? null;
  } catch {
    return null;
  }
}

// ---------- Web Push (RFC 8291 aes128gcm + VAPID) ----------

function b64urlDecode(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const raw = atob(s);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function concat(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

async function importVapidPrivateKey(rawPriv: Uint8Array, rawPub: Uint8Array): Promise<CryptoKey> {
  const jwk = {
    kty: "EC",
    crv: "P-256",
    d: b64urlEncode(rawPriv),
    x: b64urlEncode(rawPub.slice(1, 33)),
    y: b64urlEncode(rawPub.slice(33, 65)),
    ext: true,
  };
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

async function signVapidJwt(endpoint: string, subject: string, privKey: CryptoKey, pubKey: string): Promise<string> {
  const audience = new URL(endpoint).origin;
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: subject,
  };
  const enc = new TextEncoder();
  const unsigned = b64urlEncode(enc.encode(JSON.stringify(header))) + "." +
                   b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privKey,
    enc.encode(unsigned),
  );
  return unsigned + "." + b64urlEncode(sig);
}

async function encryptPayload(
  payload: Uint8Array,
  clientPub: Uint8Array,  // 65-byte uncompressed
  clientAuth: Uint8Array,
): Promise<{ body: Uint8Array }> {
  // Generate ephemeral EC keypair
  const eph = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const ephPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", eph.publicKey)); // 65 bytes

  const clientPubKey = await crypto.subtle.importKey(
    "raw", clientPub, { name: "ECDH", namedCurve: "P-256" }, false, [],
  );
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: clientPubKey }, eph.privateKey, 256,
  );
  const shared = new Uint8Array(sharedBits);

  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Per RFC 8291
  const keyInfo = concat(
    new TextEncoder().encode("WebPush: info\0"),
    clientPub,
    ephPubRaw,
  );
  const ikm = await hkdf(clientAuth, shared, concat(keyInfo, new Uint8Array([1])), 32);

  const cek = await hkdf(
    salt,
    ikm,
    concat(new TextEncoder().encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])),
    16,
  );
  const nonce = await hkdf(
    salt,
    ikm,
    concat(new TextEncoder().encode("Content-Encoding: nonce\0"), new Uint8Array([1])),
    12,
  );

  // Pad byte 0x02 (last record delimiter)
  const plaintext = concat(payload, new Uint8Array([0x02]));

  const cekKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cekKey, plaintext));

  // Header: salt(16) | rs(4 BE) | idlen(1) | keyid (65)
  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, rs, false);
  header[20] = 65;
  header.set(ephPubRaw, 21);

  return { body: concat(header, ct) };
}

async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object,
  vapid: { subject: string; publicKey: Uint8Array; privateKey: CryptoKey; publicKeyB64: string },
): Promise<{ ok: boolean; status: number }> {
  const clientPub = b64urlDecode(subscription.p256dh);
  const clientAuth = b64urlDecode(subscription.auth);
  const body = new TextEncoder().encode(JSON.stringify(payload));
  const { body: encrypted } = await encryptPayload(body, clientPub, clientAuth);
  const jwt = await signVapidJwt(subscription.endpoint, vapid.subject, vapid.privateKey, vapid.publicKeyB64);

  const res = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      "TTL": "600",
      "Urgency": "high",
      "Authorization": `vapid t=${jwt}, k=${vapid.publicKeyB64}`,
    },
    body: encrypted,
  });
  return { ok: res.ok, status: res.status };
}

function renderMessage(template: string, minutes: number) {
  return (template || "Fajr is in {minutes} minutes.").replace(/\{minutes\}/gi, String(minutes));
}

export const Route = createFileRoute("/api/public/cron/fajr-push")({
  server: {
    handlers: {
      POST: async () => {
        const publicKeyB64 = process.env.VAPID_PUBLIC_KEY;
        const privateKeyB64 = process.env.VAPID_PRIVATE_KEY;
        const subject = process.env.VAPID_SUBJECT || "mailto:hello@hayaalsalat.app";
        if (!publicKeyB64 || !privateKeyB64) {
          return new Response("VAPID keys not configured", { status: 500 });
        }
        const pubBytes = b64urlDecode(publicKeyB64);
        const privBytes = b64urlDecode(privateKeyB64);
        const privKey = await importVapidPrivateKey(privBytes, pubBytes);
        const vapid = { subject, publicKey: pubBytes, privateKey: privKey, publicKeyB64 };

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date();
        const in90s = new Date(now.getTime() + 90 * 1000);

        // Find subscriptions whose reminder time (next_fajr_utc - offset_minutes)
        // falls between (now - 90s) and (now + 90s). Cron runs every minute.
        const lower = new Date(now.getTime() - 90 * 1000).toISOString();
        const upper = in90s.toISOString();

        const { data: rows, error } = await supabaseAdmin
          .from("push_subscriptions" as never)
          .select("*")
          .not("next_fajr_utc", "is", null)
          .limit(500);
        if (error) return new Response(error.message, { status: 500 });

        let sent = 0, failed = 0, advanced = 0;
        for (const r of (rows ?? []) as any[]) {
          const nextFajr = new Date(r.next_fajr_utc);
          const fireAt = new Date(nextFajr.getTime() - r.offset_minutes * 60 * 1000);
          if (fireAt.toISOString() < lower || fireAt.toISOString() > upper) {
            // Advance stale schedules
            if (nextFajr.getTime() < now.getTime() - 60_000) {
              const next = await fetchNextFajrUtc(r.latitude, r.longitude, r.timezone, r.calc_method ?? 2, now);
              if (next) {
                await supabaseAdmin.from("push_subscriptions" as never).update({ next_fajr_utc: next } as never).eq("id", r.id);
                advanced++;
              }
            }
            continue;
          }

          const bodyText = renderMessage(r.message_template, r.offset_minutes);
          try {
            const result = await sendPush(
              { endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth },
              { title: r.title || "Haya Al-Salat", body: bodyText, tag: "fajr-reminder", url: "/" },
              vapid,
            );
            if (result.ok) {
              sent++;
              const next = await fetchNextFajrUtc(r.latitude, r.longitude, r.timezone, r.calc_method ?? 2, nextFajr);
              await supabaseAdmin.from("push_subscriptions" as never).update({
                last_sent_at: now.toISOString(),
                next_fajr_utc: next ?? null,
                failure_count: 0,
              } as never).eq("id", r.id);
              advanced++;
            } else {
              failed++;
              if (result.status === 404 || result.status === 410) {
                await supabaseAdmin.from("push_subscriptions" as never).delete().eq("id", r.id);
              } else {
                await supabaseAdmin.from("push_subscriptions" as never).update({
                  failure_count: (r.failure_count ?? 0) + 1,
                } as never).eq("id", r.id);
              }
            }
          } catch (e) {
            failed++;
          }
        }

        return Response.json({ ok: true, sent, failed, advanced, checked: rows?.length ?? 0 });
      },
      GET: async () => Response.json({ ok: true, hint: "POST to trigger" }),
    },
  },
});
