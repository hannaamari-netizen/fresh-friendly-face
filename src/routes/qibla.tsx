import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Compass, LocateFixed, Search } from "lucide-react";
import { ipLocate, reverseGeocode } from "@/lib/geo";

export const Route = createFileRoute("/qibla")({
  head: () => ({
    meta: [
      { title: "Qibla Finder — Direction to the Kaaba | Haya Al-Salat" },
      {
        name: "description",
        content:
          "Find the Qibla direction from anywhere: search any city or use your location, with a live compass pointing toward the Kaaba in Mecca.",
      },
      { property: "og:title", content: "Qibla Finder — Direction to the Kaaba" },
      {
        property: "og:description",
        content: "Search a city or use your location to get the exact Qibla bearing, with a live compass.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QiblaPage,
});

const KAABA = { lat: 21.4224779, lon: 39.8251832 };
const RAD = Math.PI / 180;

/** Great-circle initial bearing from a point to the Kaaba, in degrees from true north. */
function qiblaBearing(lat: number, lon: number): number {
  const dLon = (KAABA.lon - lon) * RAD;
  const p1 = lat * RAD;
  const p2 = KAABA.lat * RAD;
  const y = Math.sin(dLon) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dLon);
  return (Math.atan2(y, x) / RAD + 360) % 360;
}

/** Great-circle distance in kilometres. */
function distanceKm(lat: number, lon: number): number {
  const dLat = (KAABA.lat - lat) * RAD;
  const dLon = (KAABA.lon - lon) * RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat * RAD) * Math.cos(KAABA.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(a)));
}

type Place = { city: string; country: string; lat: number; lon: number };

/** City search (Open-Meteo geocoding — free, keyless). */
async function searchCities(q: string): Promise<Place[]> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`
  );
  if (!res.ok) return [];
  const j = (await res.json()) as {
    results?: Array<{ name: string; country?: string; admin1?: string; latitude: number; longitude: number }>;
  };
  return (j.results ?? []).map((r) => ({
    city: r.admin1 && r.admin1 !== r.name ? `${r.name}, ${r.admin1}` : r.name,
    country: r.country ?? "",
    lat: r.latitude,
    lon: r.longitude,
  }));
}

function QiblaPage() {
  const [place, setPlace] = useState<Place | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [heading, setHeading] = useState<number | null>(null);
  const [compassOn, setCompassOn] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const listenerRef = useRef<((e: Event) => void) | null>(null);

  const bearing = useMemo(() => (place ? qiblaBearing(place.lat, place.lon) : null), [place]);
  const distance = useMemo(() => (place ? distanceKm(place.lat, place.lon) : null), [place]);

  // Initial location: precise GPS, else approximate IP location.
  useEffect(() => {
    let cancelled = false;
    const fromCoords = async (lat: number, lon: number) => {
      const p = await reverseGeocode(lat, lon);
      if (cancelled) return;
      setPlace({ city: p?.city ?? "Your location", country: p?.country ?? "", lat, lon });
    };
    const fallback = async () => {
      const ip = await ipLocate();
      if (cancelled || !ip) return;
      setPlace({ city: ip.city || "Approximate location", country: ip.country, lat: ip.lat, lon: ip.lon });
    };
    if (!navigator.geolocation) {
      void fallback();
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => void fromCoords(pos.coords.latitude, pos.coords.longitude),
        () => void fallback(),
        { timeout: 8000, maximumAge: 5 * 60 * 1000 }
      );
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced city search.
  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const id = setTimeout(async () => {
      const r = await searchCities(t);
      setResults(r);
      setSearching(false);
    }, 350);
    return () => clearTimeout(id);
  }, [q]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setStatus("This device can't share a precise location.");
      return;
    }
    setStatus(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const p = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setPlace({
          city: p?.city ?? "Your location",
          country: p?.country ?? "",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setQ("");
        setResults([]);
      },
      () => setStatus("Location permission denied — search for your city instead.")
    );
  };

  const enableCompass = useCallback(async () => {
    type OrientationCtor = { requestPermission?: () => Promise<"granted" | "denied"> };
    const anyEvent = DeviceOrientationEvent as unknown as OrientationCtor;
    try {
      if (typeof anyEvent?.requestPermission === "function") {
        const res = await anyEvent.requestPermission();
        if (res !== "granted") {
          setStatus("Compass permission denied.");
          return;
        }
      }
    } catch {
      setStatus("Compass isn't available on this device.");
      return;
    }
    const handler = (e: Event) => {
      const ev = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
      if (typeof ev.webkitCompassHeading === "number") {
        setHeading(ev.webkitCompassHeading);
      } else if (typeof ev.alpha === "number") {
        setHeading((360 - ev.alpha) % 360);
      }
    };
    listenerRef.current = handler;
    window.addEventListener("deviceorientationabsolute", handler, true);
    window.addEventListener("deviceorientation", handler, true);
    setCompassOn(true);
    setStatus(null);
  }, []);

  useEffect(
    () => () => {
      const h = listenerRef.current;
      if (!h) return;
      window.removeEventListener("deviceorientationabsolute", h, true);
      window.removeEventListener("deviceorientation", h, true);
    },
    []
  );

  // Needle rotation: relative to the device heading when the compass is live,
  // otherwise the plain bearing from true north (map-style).
  const needle = bearing == null ? 0 : compassOn && heading != null ? bearing - heading : bearing;

  return (
    <main className="relative min-h-dvh">
      <div
        className="relative mx-auto w-full max-w-md px-6"
        style={{
          paddingTop: "calc(2.5rem + env(safe-area-inset-top))",
          paddingBottom: "calc(3rem + env(safe-area-inset-bottom))",
        }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Home
        </Link>

        <header className="mt-6 text-center">
          <p className="font-arabic text-2xl leading-none" style={{ color: "var(--gold-soft)" }}>
            ٱلْقِبْلَة
          </p>
          <h1 className="mt-3 font-display text-4xl font-medium leading-tight gold-shimmer">Qibla Finder</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Search any city, or use your location, to face the Kaaba.
          </p>
        </header>

        {/* Search */}
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a city…"
            aria-label="Search a city"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searching && <span className="text-[10px] text-muted-foreground">…</span>}
        </div>

        {results.length > 0 && (
          <ul className="mt-2 space-y-1">
            {results.map((r) => (
              <li key={`${r.city}-${r.lat}-${r.lon}`}>
                <button
                  type="button"
                  onClick={() => {
                    setPlace(r);
                    setQ("");
                    setResults([]);
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-black/20 px-4 py-2.5 text-left text-sm transition hover:bg-white/5"
                >
                  <span className="truncate">{r.city}</span>
                  <span className="ml-2 shrink-0 text-[11px] text-muted-foreground">{r.country}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={useMyLocation}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] transition hover:bg-white/10"
        >
          <LocateFixed className="h-3.5 w-3.5" /> Use my location
        </button>

        {/* Compass */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-black/25 px-4 py-6 text-center">
          {place ? (
            <>
              <p className="text-sm font-medium capitalize">
                {place.city}
                {place.country ? `, ${place.country}` : ""}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {bearing != null ? `${Math.round(bearing)}° from true north` : ""}
                {distance != null ? ` · ${distance.toLocaleString("en-US")} km to Mecca` : ""}
              </p>

              <div className="relative mx-auto mt-6 h-52 w-52">
                <div className="absolute inset-0 rounded-full border border-white/10" />
                <div className="absolute inset-6 rounded-full border border-white/5" />
                {(["N", "E", "S", "W"] as const).map((d, i) => (
                  <span
                    key={d}
                    className="absolute left-1/2 top-1/2 text-[10px] text-muted-foreground"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-6.2rem) rotate(${-i * 90}deg)`,
                    }}
                  >
                    {d}
                  </span>
                ))}
                <div
                  className="absolute inset-0 transition-transform duration-200 ease-out"
                  style={{ transform: `rotate(${needle}deg)` }}
                >
                  <div
                    className="absolute left-1/2 top-4 h-[5.5rem] w-[2px] -translate-x-1/2 rounded-full"
                    style={{ background: "linear-gradient(to bottom, var(--gold-soft), transparent)" }}
                  />
                  <div
                    className="absolute left-1/2 top-1 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-md border"
                    style={{ borderColor: "var(--gold-soft)", color: "var(--gold-soft)" }}
                    aria-hidden
                  >
                    <span className="text-[9px]">🕋</span>
                  </div>
                </div>
                <div
                  className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ background: "var(--gold-soft)" }}
                />
              </div>

              {!compassOn ? (
                <button
                  type="button"
                  onClick={enableCompass}
                  className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-amber-200/30 px-4 py-2 text-xs text-amber-100 transition hover:bg-amber-200/10"
                >
                  <Compass className="h-3.5 w-3.5" /> Enable live compass
                </button>
              ) : (
                <p className="mt-6 text-[11px] text-muted-foreground">
                  Live compass on — hold your phone flat and turn until the Kaaba marker points up.
                </p>
              )}
              {!compassOn && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Without the compass, the needle shows the bearing from true north on a map.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Finding your location…</p>
          )}
          {status && <p className="mt-3 text-[11px] text-amber-100/80">{status}</p>}
        </section>
      </div>
    </main>
  );
}
