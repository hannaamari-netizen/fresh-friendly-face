// Prayer-time calculation methods.
//
// Prayer times differ by country because each region follows a different
// recognised calculation authority (twilight angles, Isha intervals, Asr
// juristic method). Using one global method makes times wrong elsewhere —
// e.g. Riyadh must use Umm al-Qura (Makkah), where Isha is a fixed 90 minutes
// after Maghrib, not the ISNA 15° angle.
//
// IDs match the Aladhan API `method` parameter.

export type CalcMethod = {
  id: number;
  label: string;
  /** Countries (ISO 3166-1 alpha-2) that officially follow this method. */
  countries?: string[];
};

export const CALC_METHODS: CalcMethod[] = [
  { id: 4, label: "Umm al-Qura, Makkah (Saudi Arabia)", countries: ["SA"] },
  { id: 16, label: "Dubai (UAE)", countries: ["AE"] },
  { id: 8, label: "Gulf Region", countries: ["BH", "OM", "YE"] },
  { id: 9, label: "Kuwait", countries: ["KW"] },
  { id: 10, label: "Qatar", countries: ["QA"] },
  { id: 5, label: "Egyptian General Authority of Survey", countries: ["EG", "SD", "LY", "SY", "IQ", "LB", "SO", "DJ"] },
  { id: 23, label: "Jordan (Ministry of Awqaf)", countries: ["JO", "PS"] },
  { id: 7, label: "Institute of Geophysics, Tehran", countries: ["IR"] },
  { id: 13, label: "Diyanet İşleri (Turkey)", countries: ["TR"] },
  { id: 14, label: "Spiritual Administration of Muslims of Russia", countries: ["RU", "KZ", "KG", "UZ", "TJ", "TM", "AZ"] },
  { id: 1, label: "University of Islamic Sciences, Karachi", countries: ["PK", "IN", "BD", "AF", "LK", "NP"] },
  { id: 11, label: "MUIS, Singapore", countries: ["SG", "BN"] },
  { id: 17, label: "JAKIM, Malaysia", countries: ["MY"] },
  { id: 20, label: "Kemenag, Indonesia", countries: ["ID"] },
  { id: 21, label: "Morocco (Ministry of Habous)", countries: ["MA"] },
  { id: 18, label: "Tunisia", countries: ["TN"] },
  { id: 19, label: "Algeria", countries: ["DZ"] },
  { id: 22, label: "Portugal", countries: ["PT"] },
  { id: 12, label: "Union des Organisations Islamiques de France", countries: ["FR"] },
  { id: 2, label: "ISNA (North America)", countries: ["US", "CA", "MX"] },
  { id: 3, label: "Muslim World League (Europe & default)" },
];

/** Fallback when the country is unknown: Muslim World League. */
export const DEFAULT_METHOD = 3;

const BY_COUNTRY: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  for (const m of CALC_METHODS) for (const c of m.countries ?? []) map[c] = m.id;
  return map;
})();

/** Resolve the recognised calculation method for an ISO country code. */
export function methodForCountry(code?: string | null): number {
  if (!code) return DEFAULT_METHOD;
  return BY_COUNTRY[code.toUpperCase()] ?? DEFAULT_METHOD;
}

export function methodLabel(id: number): string {
  return CALC_METHODS.find((m) => m.id === id)?.label ?? `Method ${id}`;
}

const KEY = "haya-calc-method";

/** "auto" follows the detected country; a number pins a specific authority. */
export type MethodPref = "auto" | number;

export function loadMethodPref(): MethodPref {
  if (typeof window === "undefined") return "auto";
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw || raw === "auto") return "auto";
    const n = Number(raw);
    return CALC_METHODS.some((m) => m.id === n) ? n : "auto";
  } catch {
    return "auto";
  }
}

export function saveMethodPref(pref: MethodPref) {
  try {
    localStorage.setItem(KEY, String(pref));
  } catch {
    /* ignore */
  }
}
