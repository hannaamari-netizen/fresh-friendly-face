import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { ASMA_UL_HUSNA } from "@/lib/asma";

export const Route = createFileRoute("/names")({
  head: () => ({
    meta: [
      { title: "Asma Allah Al-Husna — 99 Names of Allah | Haya Al-Salat" },
      {
        name: "description",
        content:
          "Read and reflect on the 99 Names of Allah (Asma Allah Al-Husna) in Arabic with transliteration and English meanings.",
      },
      { property: "og:title", content: "Asma Allah Al-Husna — 99 Names of Allah" },
      {
        property: "og:description",
        content: "The 99 Names of Allah in Arabic with transliteration and English meanings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NamesPage,
});

function NamesPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ASMA_UL_HUSNA;
    return ASMA_UL_HUSNA.filter(
      (n) =>
        n.transliteration.toLowerCase().includes(q) ||
        n.meaning.toLowerCase().includes(q) ||
        n.arabic.includes(query.trim()) ||
        String(n.number) === q
    );
  }, [query]);

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden safe-px">
      <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Back to home"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="font-arabic text-xl leading-tight" style={{ color: "var(--gold-soft)" }} dir="rtl">
              أسماء الله الحسنى
            </p>
            <h1 className="font-display text-lg leading-tight">Asma Allah Al-Husna</h1>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          The 99 Beautiful Names of Allah — read, reflect, and remember.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, meaning, or number…"
            aria-label="Search the 99 names"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((n) => (
            <li
              key={n.number}
              className="rounded-3xl border border-white/10 bg-black/20 px-4 py-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    <span className="tabular-nums text-muted-foreground">{n.number}.</span>{" "}
                    {n.transliteration}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.meaning}</p>
                </div>
                <p
                  className="font-arabic shrink-0 text-xl leading-snug"
                  style={{ color: "var(--gold-soft)" }}
                  dir="rtl"
                >
                  {n.arabic}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {filtered.length === 0 && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            No names match “{query}”.
          </p>
        )}
      </div>
    </main>
  );
}
