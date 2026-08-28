// Location helpers: turn coordinates into a real place name, and provide an
// IP-based fallback so users who deny/skip GPS still see their own region
// (instead of a hardcoded city).

export type PlaceName = { city: string; country: string; countryCode?: string };

/** Reverse geocode coordinates to a city/country name (free, keyless). */
export async function reverseGeocode(lat: number, lon: number): Promise<PlaceName | null> {
  // Primary: BigDataCloud (current domain — the old api.bigdatacloud.net host
  // now answers with a cross-origin 307 redirect).
  try {
    const res = await fetch(
      `https://api-bdc.io/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (res.ok) {
      const j = (await res.json()) as {
        city?: string;
        locality?: string;
        principalSubdivision?: string;
        countryName?: string;
        countryCode?: string;
      };
      const city = j.city || j.locality || j.principalSubdivision || "";
      if (city) return { city, country: j.countryName ?? "", countryCode: j.countryCode };
    }
  } catch {
    /* fall through to secondary provider */
  }
  // Secondary: Open-Meteo geocoding-free reverse lookup via BDC mirror host.
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { redirect: "follow" }
    );
    if (!res.ok) return null;
    const j = (await res.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      countryName?: string;
      countryCode?: string;
    };
    const city = j.city || j.locality || j.principalSubdivision || "";
    if (!city) return null;
    return { city, country: j.countryName ?? "", countryCode: j.countryCode };
  } catch {
    return null;
  }
}


export type IpLocation = { lat: number; lon: number; city: string; country: string; countryCode?: string };

/** Approximate location from the visitor's IP address (free, keyless). */
export async function ipLocate(): Promise<IpLocation | null> {
  try {
    const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
    if (!res.ok) return null;
    const j = (await res.json()) as {
      latitude?: string;
      longitude?: string;
      city?: string;
      country?: string;
      country_code?: string;
    };
    const lat = Number(j.latitude);
    const lon = Number(j.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon, city: j.city ?? "", country: j.country ?? "", countryCode: j.country_code };
  } catch {
    return null;
  }
}
