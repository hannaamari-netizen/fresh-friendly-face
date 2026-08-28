import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, HandHeart, MoonStar, Sparkles, Sun } from "lucide-react";
import {
  ATHKAR_EVENING,
  ATHKAR_MORNING,
  DUAS_AFTER,
  DUAS_BEFORE,
  type Dua,
} from "@/lib/duas";

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

function DuaCard({ dua }: { dua: Dua }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-3xl border border-white/5 bg-black/20 px-4 py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-medium">{dua.title}</span>
        <span className="text-[11px] text-muted-foreground">{open ? "Hide" : "Open"}</span>
      </button>
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
] as const;

type TabId = (typeof TABS)[number]["id"];

const LISTS: Record<TabId, Dua[]> = {
  before: DUAS_BEFORE,
  after: DUAS_AFTER,
  morning: ATHKAR_MORNING,
  evening: ATHKAR_EVENING,
};

function DuasPage() {
  // Default to the session that fits the time of day (set after mount so SSR
  // and the first client render agree).
  const [tab, setTab] = useState<TabId>("before");
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 11) setTab("morning");
    else if (h >= 17) setTab("evening");
  }, []);
  const list = LISTS[tab];


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

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-3xl border border-white/10 bg-white/5 p-1 text-xs">
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


        <ul className="mt-5 space-y-3">
          {list.map((d) => (
            <DuaCard key={d.id} dua={d} />
          ))}
        </ul>

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          Tap a dua to reveal the transliteration and the English and Swedish meaning.
        </p>
      </div>
    </main>
  );
}
