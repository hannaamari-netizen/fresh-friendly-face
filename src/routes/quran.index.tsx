import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BookmarkCheck, BookOpen, ChevronLeft, Search, X } from "lucide-react";
import { surahListQuery } from "@/lib/quran";
import { percentRead, useBookmarks, useReadingProgress } from "@/lib/quranProgress";

export const Route = createFileRoute("/quran/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(surahListQuery),
  head: () => ({
    meta: [
      { title: "The Holy Quran — Arabic, English & Swedish | Haya Al-Salat" },
      {
        name: "description",
        content:
          "Read all 114 surahs of the Holy Quran in Arabic with English and Swedish translations, with recitation audio for every surah.",
      },
      { property: "og:title", content: "The Holy Quran — Arabic, English & Swedish" },
      {
        property: "og:description",
        content: "All 114 surahs in Arabic with English and Swedish translations, plus recitation audio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuranIndex,
});

function QuranIndex() {
  const { data: surahs } = useSuspenseQuery(surahListQuery);
  const [q, setQ] = useState("");
  const { bookmarks, remove } = useBookmarks();
  const { last, forSurah, recent, ready: progressReady } = useReadingProgress();

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return surahs;
    return surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(t) ||
        s.englishNameTranslation.toLowerCase().includes(t) ||
        s.name.includes(q.trim()) ||
        String(s.number) === t
    );
  }, [q, surahs]);

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
            ٱلْقُرْآنُ ٱلْكَرِيم
          </p>
          <h1 className="mt-3 font-display text-4xl font-medium leading-tight gold-shimmer">The Holy Quran</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            All 114 surahs — Arabic with English and Swedish translations.
          </p>
        </header>

        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search surah…"
            aria-label="Search surah"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Continue reading */}
        {last && (
          <Link
            to="/quran/$surah"
            params={{ surah: String(last.surah) }}
            className="mt-4 block rounded-3xl border border-amber-200/25 bg-amber-200/5 px-4 py-4 transition hover:bg-amber-200/10"
          >
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Continue reading</p>
            <p className="mt-1 text-sm font-medium text-amber-100">
              {last.surah}. {last.surahName} · verse {last.ayah}
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${percentRead(last)}%`, background: "var(--gold-soft)" }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{percentRead(last)}% read</p>
          </Link>
        )}

        {/* Bookmarks */}
        {bookmarks.length > 0 && (
          <section className="mt-4 rounded-3xl border border-white/10 bg-black/20 px-4 py-4">
            <h2 className="flex items-center gap-1.5 text-xs font-medium">
              <BookmarkCheck className="h-3.5 w-3.5" style={{ color: "var(--gold-soft)" }} />
              Bookmarks
              <span className="text-muted-foreground">({bookmarks.length})</span>
            </h2>
            <ul className="mt-3 space-y-1.5">
              {bookmarks.slice(0, 12).map((b) => (
                <li key={`${b.surah}:${b.ayah}`} className="flex items-center gap-2">
                  <Link
                    to="/quran/$surah"
                    params={{ surah: String(b.surah) }}
                    hash={`ayah-${b.ayah}`}
                    className="min-w-0 flex-1 truncate rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-[12px] transition hover:bg-white/10"
                  >
                    {b.surahName} · {b.surah}:{b.ayah}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(b.surah, b.ayah)}
                    aria-label={`Remove bookmark ${b.surah}:${b.ayah}`}
                    className="rounded-full border border-white/10 p-1.5 text-muted-foreground transition hover:bg-white/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {progressReady && recent.length > 1 && (
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Reading progress saved for {recent.length} surahs on this device.
          </p>
        )}

        <ul className="mt-4 space-y-1.5">
          {filtered.map((s) => (
            <li key={s.number}>
              <Link
                to="/quran/$surah"
                params={{ surah: String(s.number) }}
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 px-4 py-3 transition hover:bg-white/5"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-[11px]"
                  style={{ color: "var(--gold-soft)" }}
                >
                  {s.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.englishName}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {s.englishNameTranslation} · {s.numberOfAyahs} verses · {s.revelationType}
                  </span>
                </span>
                {(() => {
                  const p = forSurah(s.number);
                  return p ? (
                    <span className="shrink-0 rounded-full border border-amber-200/30 px-2 py-0.5 text-[10px] text-amber-100">
                      {percentRead(p)}%
                    </span>
                  ) : null;
                })()}
                <span className="font-arabic text-lg" style={{ color: "var(--gold-soft)" }} dir="rtl">
                  {s.name}
                </span>
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="rounded-2xl border border-white/5 bg-black/20 px-4 py-6 text-center text-sm text-muted-foreground">
              No surah matches “{q}”.
            </li>
          )}
        </ul>

        <p className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" /> Translations: Saheeh International (EN) · Knut Bernström (SV)
        </p>
      </div>
    </main>
  );
}
