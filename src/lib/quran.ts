// Quran data helpers (AlQuran Cloud — free, keyless).
// Arabic (Uthmani script) + English (Saheeh International) + Swedish (Bernström).

const API = "https://api.alquran.cloud/v1";

export const EDITIONS = {
  arabic: "quran-uthmani",
  english: "en.sahih",
  swedish: "sv.bernstrom",
} as const;

/** Reciter used for full-surah audio (Mishary Alafasy, 128kbps). */
export function surahAudioUrl(surah: number): string {
  return `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surah}.mp3`;
}

export type SurahMeta = {
  number: number;
  name: string; // Arabic
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
};

export type Ayah = {
  numberInSurah: number;
  arabic: string;
  english: string;
  swedish: string;
};

export type SurahDetail = SurahMeta & { ayahs: Ayah[] };

export async function fetchSurahList(): Promise<SurahMeta[]> {
  const res = await fetch(`${API}/surah`);
  if (!res.ok) throw new Error("Couldn't load the list of surahs.");
  const j = (await res.json()) as { data: SurahMeta[] };
  return j.data;
}

export async function fetchSurah(number: number): Promise<SurahDetail> {
  const editions = `${EDITIONS.arabic},${EDITIONS.english},${EDITIONS.swedish}`;
  const res = await fetch(`${API}/surah/${number}/editions/${editions}`);
  if (!res.ok) throw new Error("Couldn't load this surah.");
  const j = (await res.json()) as {
    data: Array<SurahMeta & { ayahs: Array<{ numberInSurah: number; text: string }> }>;
  };
  const [ar, en, sv] = j.data;
  if (!ar) throw new Error("Couldn't load this surah.");
  const ayahs: Ayah[] = ar.ayahs.map((a, i) => ({
    numberInSurah: a.numberInSurah,
    // Strip the BOM the API prepends to the first ayah of some surahs.
    arabic: a.text.replace(/\uFEFF/g, "").trim(),
    english: en?.ayahs[i]?.text ?? "",
    swedish: sv?.ayahs[i]?.text ?? "",
  }));
  return {
    number: ar.number,
    name: ar.name,
    englishName: ar.englishName,
    englishNameTranslation: ar.englishNameTranslation,
    numberOfAyahs: ar.numberOfAyahs,
    revelationType: ar.revelationType,
    ayahs,
  };
}

export const surahListQuery = {
  queryKey: ["quran", "surahs"] as const,
  queryFn: fetchSurahList,
  staleTime: Infinity,
};

export const surahQuery = (number: number) => ({
  queryKey: ["quran", "surah", number] as const,
  queryFn: () => fetchSurah(number),
  staleTime: Infinity,
});
