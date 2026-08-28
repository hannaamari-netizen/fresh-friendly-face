import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const CURRENT_VERSION = "1.2.0";
const SEEN_KEY = "haya-whats-new-seen";

const SECTIONS = [
  {
    title: "Recitation before Fajr",
    items: [
      "Choose your favourite surah to recite before Fajr — Al-Mu'minun remains the default",
      "Recitations by Mukhtar Al-Hajj",
      "Configurable lead time (5–30 minutes before Fajr)",
    ],
  },
  {
    title: "Adhan",
    items: [
      "New, clearer Adhan voice for Dhuhr, Asr, Maghrib and Isha",
      "Fajr Adhan unchanged, including “Al-salatu khayrun mina n-nawm”",
      "In-app Adhan preview and one-tap test mode for Fajr through Isha",
      "Background preloading and caching so alerts play instantly",
    ],
  },
  {
    title: "Prayer times",
    items: [
      "Country-aware calculation methods — Umm al-Qura for Saudi Arabia",
      "Accurate location detection (GPS, IP and reverse geocoding)",
    ],
  },
  {
    title: "New sections",
    items: [
      "Asma Allah al-Husna — the 99 names of Allah",
      "Tasbih counter with customizable phrases and reminders",
      "Quran in Arabic, English and Swedish with bookmarks, progress and streaks",
      "Dua sessions before and after prayer, with audio",
      "Athkar Al-Sabah and Athkar Al-Masa",
      "Qibla finder with history and favourite locations",
    ],
  },
  {
    title: "Improvements",
    items: [
      "Offline recitation caching with Wi-Fi/charging auto-download",
      "Lock-screen media controls for recitations",
      "Requires iOS 15 or later",
    ],
  },
];

export const Route = createFileRoute("/whats-new")({
  head: () => ({
    meta: [
      { title: "What's New in 1.2 — Haya Al-Salat" },
      { name: "description", content: "See what's new in Haya Al-Salat version 1.2." },
      { property: "og:title", content: "What's New in 1.2 — Haya Al-Salat" },
      { property: "og:description", content: "See what's new in Haya Al-Salat version 1.2." },
    ],
  }),
  component: WhatsNewPage,
});

export function shouldShowWhatsNew(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SEEN_KEY) !== CURRENT_VERSION;
  } catch {
    return false;
  }
}

export function markWhatsNewSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, CURRENT_VERSION);
  } catch {
    /* ignore */
  }
}

function WhatsNewPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm font-medium text-muted-foreground">Haya Al-Salat</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">
        What's New in Version 1.2
      </h1>
      <p className="mt-2 text-muted-foreground">
        Jazakum Allahu khayran for updating. Here is what this release brings.
      </p>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border bg-card p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/"
          onClick={markWhatsNewSeen}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Continue to Haya Al-Salat
        </Link>
        {ready && (
          <span className="self-center text-xs text-muted-foreground">
            Version {CURRENT_VERSION} · Build 8
          </span>
        )}
      </div>
    </main>
  );
}
