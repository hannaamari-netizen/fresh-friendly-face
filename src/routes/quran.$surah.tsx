import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { surahQuery, surahAudioUrl } from "@/lib/quran";
import { percentRead, useBookmarks, useReadingProgress } from "@/lib/quranProgress";

export const Route = createFileRoute("/quran/$surah")({
  params: {
    parse: ({ surah }) => {
      const n = Number(surah);
      if (!Number.isInteger(n) || n < 1 || n > 114) throw notFound();
      return { surah: String(n) };
    },
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(surahQuery(Number(params.surah))),
  head: ({ loaderData }) => {
    const name = loaderData?.englishName ?? "Surah";
    return {
      meta: [
        { title: `${name} — Arabic, English & Swedish | Haya Al-Salat` },
        {
          name: "description",
          content: `Read Surah ${name} (${loaderData?.englishNameTranslation ?? ""}) in Arabic with English and Swedish translations, and listen to the full recitation.`,
        },
        { property: "og:title", content: `Surah ${name} — Quran in Arabic, English & Swedish` },
        {
          property: "og:description",
          content: `Arabic text with English and Swedish translations, plus recitation audio for Surah ${name}.`,
        },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: SurahReader,
});

function SurahReader() {
  const { surah } = Route.useParams();
  const number = Number(surah);
  const { data } = useSuspenseQuery(surahQuery(number));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showEn, setShowEn] = useState(true);
  const [showSv, setShowSv] = useState(true);
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const { record, forSurah, ready: progressReady } = useReadingProgress();
  const saved = progressReady ? forSurah(number) : undefined;
  const [resumed, setResumed] = useState(false);

  // Track the top-most visible verse and store it as reading progress.
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-ayah]"));
    if (!nodes.length) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => Number((e.target as HTMLElement).dataset.ayah))
          .sort((a, b) => a - b);
        const ayah = visible[0];
        if (!ayah) return;
        clearTimeout(timer);
        timer = setTimeout(
          () =>
            record({
              surah: number,
              ayah,
              totalAyahs: data.numberOfAyahs,
              surahName: data.englishName,
            }),
          600
        );
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    nodes.forEach((n) => io.observe(n));
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [number, data.numberOfAyahs, data.englishName, record]);

  const jumpTo = (ayah: number) => {
    document
      .querySelector(`[data-ayah="${ayah}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Reset playback when navigating between surahs.
  useEffect(() => {
    setResumed(false);
    setPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
  }, [number]);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    try {
      await el.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  return (
    <main className="relative min-h-dvh">
      <div
        className="relative mx-auto w-full max-w-md px-6"
        style={{
          paddingTop: "calc(2.5rem + env(safe-area-inset-top))",
          paddingBottom: "calc(6rem + env(safe-area-inset-bottom))",
        }}
      >
        <Link
          to="/quran"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> All surahs
        </Link>

        <header className="mt-6 text-center">
          <p className="font-arabic text-3xl leading-tight" style={{ color: "var(--gold-soft)" }} dir="rtl">
            {data.name}
          </p>
          <h1 className="mt-3 font-display text-3xl font-medium gold-shimmer">
            {data.number}. {data.englishName}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.englishNameTranslation} · {data.numberOfAyahs} verses · {data.revelationType}
          </p>
        </header>

        {/* Recitation player */}
        <div className="mt-6 flex items-center gap-3 rounded-3xl border border-white/10 bg-black/25 px-4 py-3">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause recitation" : "Play recitation"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-200/30 transition hover:bg-amber-200/10"
            style={{ color: "var(--gold-soft)" }}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Recitation · {data.englishName}</p>
            <p className="text-[11px] text-muted-foreground">Mishary Rashid Alafasy</p>
          </div>
          <audio
            ref={audioRef}
            src={surahAudioUrl(number)}
            preload="none"
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
        </div>

        {/* Translation toggles */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px]">
          <span className="text-muted-foreground">Show:</span>
          <button
            type="button"
            onClick={() => setShowEn((v) => !v)}
            className={`rounded-full border px-3 py-1 transition ${
              showEn ? "border-amber-200/40 text-amber-100" : "border-white/10 text-muted-foreground"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setShowSv((v) => !v)}
            className={`rounded-full border px-3 py-1 transition ${
              showSv ? "border-amber-200/40 text-amber-100" : "border-white/10 text-muted-foreground"
            }`}
          >
            Svenska
          </button>
        </div>

        {/* Resume where you left off */}
        {saved && saved.ayah > 1 && !resumed && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200/25 bg-amber-200/5 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-amber-100">
                You stopped at verse {saved.ayah}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{percentRead(saved)}% read</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${percentRead(saved)}%`, background: "var(--gold-soft)" }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                jumpTo(saved.ayah);
                setResumed(true);
              }}
              className="shrink-0 rounded-full border border-amber-200/40 px-3 py-1.5 text-[11px] text-amber-100 transition hover:bg-amber-200/10"
            >
              Resume
            </button>
          </div>
        )}

        {/* Verses */}
        <ol className="mt-6 space-y-4">
          {data.ayahs.map((a) => (
            <li
              key={a.numberInSurah}
              id={`ayah-${a.numberInSurah}`}
              data-ayah={a.numberInSurah}
              className="scroll-mt-24 rounded-3xl border border-white/5 bg-black/20 px-4 py-4"
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-6 min-w-6 items-center justify-center rounded-full border border-white/10 px-1.5 text-[10px]"
                  style={{ color: "var(--gold-soft)" }}
                >
                  {a.numberInSurah}
                </span>
                <button
                  type="button"
                  onClick={() => toggleBookmark(number, a.numberInSurah, data.englishName)}
                  aria-label={
                    isBookmarked(number, a.numberInSurah)
                      ? `Remove bookmark on verse ${a.numberInSurah}`
                      : `Bookmark verse ${a.numberInSurah}`
                  }
                  aria-pressed={isBookmarked(number, a.numberInSurah)}
                  className="rounded-full border border-white/10 p-1.5 transition hover:bg-white/10"
                  style={{ color: isBookmarked(number, a.numberInSurah) ? "var(--gold-soft)" : undefined }}
                >
                  {isBookmarked(number, a.numberInSurah) ? (
                    <BookmarkCheck className="h-3.5 w-3.5" />
                  ) : (
                    <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
              <p
                dir="rtl"
                lang="ar"
                className="mt-3 font-arabic text-2xl leading-[2.2] text-right"
                style={{ color: "var(--gold-soft)" }}
              >
                {a.arabic}
              </p>
              {showEn && a.english && (
                <p lang="en" className="mt-3 text-sm leading-relaxed text-foreground/90">
                  {a.english}
                </p>
              )}
              {showSv && a.swedish && (
                <p lang="sv" className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {a.swedish}
                </p>
              )}
            </li>
          ))}
        </ol>

        {/* Prev / next */}
        <nav className="mt-8 flex items-center justify-between gap-3">
          {number > 1 ? (
            <Link
              to="/quran/$surah"
              params={{ surah: String(number - 1) }}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs transition hover:bg-white/10"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Link>
          ) : (
            <span />
          )}
          {number < 114 ? (
            <Link
              to="/quran/$surah"
              params={{ surah: String(number + 1) }}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs transition hover:bg-white/10"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </main>
  );
}
