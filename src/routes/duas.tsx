import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, ChevronLeft, HandHeart, MoonStar, Pause, Play, Sparkles, Sun } from "lucide-react";
import {
  ATHKAR_EVENING,
  ATHKAR_MORNING,
  DUAS_AFTER,
  DUAS_BEFORE,
  type Dua,
} from "@/lib/duas";
import { getDuaBookmarks, toggleDuaBookmark } from "@/lib/duaBookmarks";

export const Route = createFileRoute("/duas")({
  head: () => ({
    meta: [
      { title: "Dua Before & After Prayer — Arabic, English, Swedish | Haya Al-Salat" },
      {
        name: "description",
        content:
          "Gentle dua sessions for before and after every prayer, with Arabic text, transliteration, and English and Swedish meanings.",
      },
      { property: "og:title", content: "Dua Before & After Prayer" },
      {
        property: "og:description",
        content: "Duas for before and after salah in Arabic with transliteration and English/Swedish meaning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DuasPage,
});

// --- Shared speech engine: one utterance at a time across all cards ---

type SpeechState = { id: string | null; playing: boolean };

let speechListeners: Array<(s: SpeechState) => void> = [];
let speechState: SpeechState = { id: null, playing: false };
let currentUtterance: SpeechSynthesisUtterance | null = null;

function emitSpeech() {
  for (const fn of speechListeners) fn(speechState);
}

function subscribeSpeech(fn: (s: SpeechState) => void) {
  speechListeners.push(fn);
  return () => {
    speechListeners = speechListeners.filter((f) => f !== fn);
  };
}

function pickArabicVoice(): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith("ar") && /arab|ar[-_]/i.test(v.lang + v.name)) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("ar"))
  );
}

function stopSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
  speechState = { id: null, playing: false };
  emitSpeech();
}

function playDua(dua: Dua) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  // Toggle pause/resume when the same dua is active.
  if (speechState.id === dua.id && currentUtterance) {
    if (speechState.playing) {
      window.speechSynthesis.pause();
      speechState = { id: dua.id, playing: false };
    } else {
      window.speechSynthesis.resume();
      speechState = { id: dua.id, playing: true };
    }
    emitSpeech();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(dua.arabic);
  utterance.lang = "ar-SA";
  utterance.rate = 0.85;
  const voice = pickArabicVoice();
  if (voice) utterance.voice = voice;
  currentUtterance = utterance;
  speechState = { id: dua.id, playing: true };
  utterance.onend = () => stopSpeech();
  utterance.onerror = () => stopSpeech();
  emitSpeech();
  window.speechSynthesis.speak(utterance);
}

function useSpeechState(): SpeechState {
  const [state, setState] = useState(speechState);
  useEffect(() => subscribeSpeech(setState), []);
  return state;
}

const speechSupported =
  typeof window !== "undefined" && "speechSynthesis" in window;

function DuaCard({
  dua,
  bookmarked,
  onToggleBookmark,
}: {
  dua: Dua;
  bookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const speech = useSpeechState();
  const isActive = speech.id === dua.id;
  const isPlaying = isActive && speech.playing;

  return (
    <li className="rounded-3xl border border-white/5 bg-black/20 px-4 py-4">
      <div className="flex w-full items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex flex-1 items-center justify-between gap-3 text-left"
        >
          <span className="text-sm font-medium">{dua.title}</span>
          <span className="text-[11px] text-muted-foreground">{open ? "Hide" : "Open"}</span>
        </button>
        <div className="flex items-center gap-1">
          {speechSupported && (
            <button
              type="button"
              onClick={() => playDua(dua)}
              aria-label={isPlaying ? `Pause ${dua.title}` : `Listen to ${dua.title}`}
              className={`rounded-full p-1.5 transition ${
                isActive ? "text-amber-200" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => onToggleBookmark(dua.id)}
            aria-label={bookmarked ? `Remove ${dua.title} from saved duas` : `Save ${dua.title}`}
            aria-pressed={bookmarked}
            className={`rounded-full p-1.5 transition ${
              bookmarked ? "text-amber-200" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark className="h-4 w-4" fill={bookmarked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      <p
        dir="rtl"
        lang="ar"
        className="mt-3 font-arabic text-2xl leading-[2.1] text-right"
        style={{ color: "var(--gold-soft)" }}
      >
        {dua.arabic}
      </p>
      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-xs italic text-amber-100/80">{dua.transliteration}</p>
          <p lang="en" className="text-sm leading-relaxed text-foreground/90">
            {dua.english}
          </p>
          <p lang="sv" className="text-sm leading-relaxed text-muted-foreground">
            {dua.swedish}
          </p>
          {dua.note && <p className="text-[11px] text-muted-foreground">{dua.note}</p>}
        </div>
      )}
    </li>
  );
}

const TABS = [
  { id: "before", label: "Before prayer", icon: HandHeart },
  { id: "after", label: "After prayer", icon: Sparkles },
  { id: "morning", label: "Athkar as-Sabah", icon: Sun },
  { id: "evening", label: "Athkar al-Masa", icon: MoonStar },
  { id: "saved", label: "Saved", icon: Bookmark },
] as const;

type TabId = (typeof TABS)[number]["id"];

const ALL_DUAS: Dua[] = [...DUAS_BEFORE, ...DUAS_AFTER, ...ATHKAR_MORNING, ...ATHKAR_EVENING];

const LISTS: Record<Exclude<TabId, "saved">, Dua[]> = {
  before: DUAS_BEFORE,
  after: DUAS_AFTER,
  morning: ATHKAR_MORNING,
  evening: ATHKAR_EVENING,
};

function DuasPage() {
  // Default to the session that fits the time of day (set after mount so SSR
  // and the first client render agree).
  const [tab, setTab] = useState<TabId>("before");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    setBookmarks(getDuaBookmarks());
    const h = new Date().getHours();
    if (h < 11) setTab("morning");
    else if (h >= 17) setTab("evening");
    // Warm the voice list (some browsers load voices asynchronously).
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
    return () => stopSpeech();
  }, []);

  const onToggleBookmark = useCallback((id: string) => {
    setBookmarks(toggleDuaBookmark(id));
  }, []);

  const list = useMemo<Dua[]>(() => {
    if (tab === "saved") return ALL_DUAS.filter((d) => bookmarks.includes(d.id));
    return LISTS[tab];
  }, [tab, bookmarks]);

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
            الدُّعَاء
          </p>
          <h1 className="mt-3 font-display text-4xl font-medium leading-tight gold-shimmer">Dua Sessions</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Before and after the prayer, and the morning and evening athkar.
          </p>
        </header>

        <div className="mt-6 grid grid-cols-3 gap-2 rounded-3xl border border-white/10 bg-white/5 p-1 text-xs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2 transition ${
                tab === id ? "bg-amber-200/15 text-amber-100" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" /> {label}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            No saved duas yet. Tap the bookmark on any dua to keep it here.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {list.map((d) => (
              <DuaCard
                key={d.id}
                dua={d}
                bookmarked={bookmarks.includes(d.id)}
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </ul>
        )}

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          Tap a dua to reveal the transliteration and the English and Swedish meaning. Press play to
          listen in Arabic.
        </p>
      </div>
    </main>
  );
}
