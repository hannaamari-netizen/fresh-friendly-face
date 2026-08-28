// Curated list of surahs recited by Mukhtar Al-Hajj (Hafs 'an 'Asim) that the
// user can choose to listen to before Fajr. Audio is served from mp3quran.net,
// which hosts the reciter's complete 114-surah library.
export type FajrSurah = {
  number: number;
  name: string;
  arabic: string;
};

export const FAJR_SURAHS: FajrSurah[] = [
  { number: 1, name: "Surat Al-Fatihah", arabic: "سورة الفاتحة" },
  { number: 18, name: "Surat Al-Kahf", arabic: "سورة الكهف" },
  { number: 19, name: "Surat Maryam", arabic: "سورة مريم" },
  { number: 20, name: "Surat Ta-Ha", arabic: "سورة طه" },
  { number: 23, name: "Surat Al-Mu'minun", arabic: "سورة المؤمنون" },
  { number: 36, name: "Surat Ya-Sin", arabic: "سورة يس" },
  { number: 55, name: "Surat Ar-Rahman", arabic: "سورة الرحمن" },
  { number: 56, name: "Surat Al-Waqi'ah", arabic: "سورة الواقعة" },
  { number: 67, name: "Surat Al-Mulk", arabic: "سورة الملك" },
  { number: 78, name: "Surat An-Naba", arabic: "سورة النبأ" },
  { number: 93, name: "Surat Ad-Duha", arabic: "سورة الضحى" },
  { number: 94, name: "Surat Ash-Sharh", arabic: "سورة الشرح" },
  { number: 97, name: "Surat Al-Qadr", arabic: "سورة القدر" },
  { number: 112, name: "Surat Al-Ikhlas", arabic: "سورة الإخلاص" },
  { number: 113, name: "Surat Al-Falaq", arabic: "سورة الفلق" },
  { number: 114, name: "Surat An-Nas", arabic: "سورة الناس" },
];

export const DEFAULT_FAJR_SURAH = 23; // Surat Al-Mu'minun

const STORAGE_KEY = "haya-fajr-surah";

export function surahAudioUrl(surahNumber: number): string {
  const n = String(surahNumber).padStart(3, "0");
  return `https://server16.mp3quran.net/mukhtar_haj/Rewayat-Hafs-A-n-Assem/${n}.mp3`;
}

export function getFajrSurah(surahNumber: number): FajrSurah {
  return (
    FAJR_SURAHS.find((s) => s.number === surahNumber) ??
    FAJR_SURAHS.find((s) => s.number === DEFAULT_FAJR_SURAH)!
  );
}

export function loadFajrSurah(): number {
  if (typeof window === "undefined") return DEFAULT_FAJR_SURAH;
  const raw = localStorage.getItem(STORAGE_KEY);
  const n = raw ? Number(raw) : NaN;
  return FAJR_SURAHS.some((s) => s.number === n) ? n : DEFAULT_FAJR_SURAH;
}

export function saveFajrSurah(surahNumber: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(surahNumber));
  } catch {
    /* ignore */
  }
}
