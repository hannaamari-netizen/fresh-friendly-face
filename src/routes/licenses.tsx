import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/licenses")({
  head: () => ({
    meta: [
      { title: "Open Source Licenses — Haya Al-Salat" },
      {
        name: "description",
        content:
          "Third-party open-source packages used by Haya Al-Salat and their licenses.",
      },
      { property: "og:title", content: "Open Source Licenses — Haya Al-Salat" },
      {
        property: "og:description",
        content:
          "Third-party open-source packages used by Haya Al-Salat and their licenses.",
      },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: LicensesPage,
});

type Dep = { name: string; license: string; url: string };

// Core runtime dependencies. Full list is in package.json.
const DEPENDENCIES: Dep[] = [
  { name: "react", license: "MIT", url: "https://github.com/facebook/react" },
  { name: "react-dom", license: "MIT", url: "https://github.com/facebook/react" },
  { name: "@tanstack/react-router", license: "MIT", url: "https://github.com/TanStack/router" },
  { name: "@tanstack/react-start", license: "MIT", url: "https://github.com/TanStack/router" },
  { name: "@tanstack/react-query", license: "MIT", url: "https://github.com/TanStack/query" },
  { name: "@tanstack/router-plugin", license: "MIT", url: "https://github.com/TanStack/router" },
  { name: "@supabase/supabase-js", license: "MIT", url: "https://github.com/supabase/supabase-js" },
  { name: "tailwindcss", license: "MIT", url: "https://github.com/tailwindlabs/tailwindcss" },
  { name: "@tailwindcss/vite", license: "MIT", url: "https://github.com/tailwindlabs/tailwindcss" },
  { name: "tw-animate-css", license: "MIT", url: "https://github.com/Wombosvideo/tw-animate-css" },
  { name: "tailwind-merge", license: "MIT", url: "https://github.com/dcastil/tailwind-merge" },
  { name: "class-variance-authority", license: "Apache-2.0", url: "https://github.com/joe-bell/cva" },
  { name: "clsx", license: "MIT", url: "https://github.com/lukeed/clsx" },
  { name: "lucide-react", license: "ISC", url: "https://github.com/lucide-icons/lucide" },
  { name: "sonner", license: "MIT", url: "https://github.com/emilkowalski/sonner" },
  { name: "vaul", license: "MIT", url: "https://github.com/emilkowalski/vaul" },
  { name: "cmdk", license: "MIT", url: "https://github.com/pacocoursey/cmdk" },
  { name: "date-fns", license: "MIT", url: "https://github.com/date-fns/date-fns" },
  { name: "zod", license: "MIT", url: "https://github.com/colinhacks/zod" },
  { name: "react-hook-form", license: "MIT", url: "https://github.com/react-hook-form/react-hook-form" },
  { name: "@hookform/resolvers", license: "MIT", url: "https://github.com/react-hook-form/resolvers" },
  { name: "react-day-picker", license: "MIT", url: "https://github.com/gpbl/react-day-picker" },
  { name: "react-resizable-panels", license: "MIT", url: "https://github.com/bvaughn/react-resizable-panels" },
  { name: "embla-carousel-react", license: "MIT", url: "https://github.com/davidjerleke/embla-carousel" },
  { name: "input-otp", license: "MIT", url: "https://github.com/guilhermerodz/input-otp" },
  { name: "recharts", license: "MIT", url: "https://github.com/recharts/recharts" },
  { name: "web-push", license: "MIT", url: "https://github.com/web-push-libs/web-push" },
  { name: "@radix-ui/react-* (primitives)", license: "MIT", url: "https://github.com/radix-ui/primitives" },
  { name: "vite", license: "MIT", url: "https://github.com/vitejs/vite" },
  { name: "vite-tsconfig-paths", license: "MIT", url: "https://github.com/aleclarson/vite-tsconfig-paths" },
];

const CONTENT_ATTRIBUTIONS = [
  {
    name: "Aladhan Prayer Times API",
    detail: "Prayer time calculations",
    url: "https://aladhan.com/prayer-times-api",
  },
  {
    name: "Surat Al-Mu'minun — Mukhtar Al-Hajj",
    detail: "Recitation streamed from a public archive; all rights belong to the reciter.",
    url: "",
  },
];

function LicensesPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 pb-safe pt-safe text-foreground">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to app
      </Link>

      <header className="mb-8">
        <p
          className="text-[11px] uppercase tracking-[0.3em]"
          style={{ color: "var(--gold-soft)" }}
        >
          Haya Al-Salat
        </p>
        <h1 className="mt-2 font-display text-3xl leading-tight">Open Source Licenses</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Haya Al-Salat is built on the work of a generous open-source community. The packages
          below are used under their respective licenses. Full license texts are available at each
          project's source repository.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-lg">Software dependencies</h2>
        <ul className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.02]">
          {DEPENDENCIES.map((dep) => (
            <li
              key={dep.name}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <a
                href={dep.url}
                target="_blank"
                rel="noreferrer"
                className="truncate font-mono text-xs text-foreground underline-offset-4 hover:underline"
              >
                {dep.name}
              </a>
              <span
                className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
              >
                {dep.license}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          The complete dependency tree, including transitive packages, is enumerated in the
          project's <code className="font-mono">package.json</code> and lockfile.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-lg">Content & data</h2>
        <ul className="space-y-3 text-sm text-muted-foreground">
          {CONTENT_ATTRIBUTIONS.map((item) => (
            <li
              key={item.name}
              className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3"
            >
              <p className="text-foreground">
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    {item.name}
                  </a>
                ) : (
                  item.name
                )}
              </p>
              <p className="mt-1 text-xs">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-10 text-center text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70">
        ✍️ Created with care by Inoxin HA
      </footer>
    </main>
  );
}
