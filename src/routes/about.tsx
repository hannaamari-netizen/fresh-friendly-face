import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Haya Al-Salat" },
      {
        name: "description",
        content:
          "App version, build number, and bundle identifier for Haya Al-Salat — useful for App Store review and support.",
      },
      { property: "og:title", content: "About — Haya Al-Salat" },
      {
        property: "og:description",
        content:
          "Version, build, and bundle information for the Haya Al-Salat Fajr companion.",
      },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: AboutPage,
});

// Keep these in sync with the native projects at release time.
// iOS      → Info.plist CFBundleShortVersionString / CFBundleVersion
// Android  → android/app/build.gradle versionName / versionCode
const APP_NAME = "Haya Al-Salat";
const APP_VERSION = "1.0.0"; // marketing version (CFBundleShortVersionString / versionName)
const APP_BUILD = "1";        // build number   (CFBundleVersion / versionCode)
const BUNDLE_ID = "app.hayaalsalat.companion";
const RELEASE_CHANNEL = import.meta.env.MODE === "production" ? "production" : "preview";
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const OWNER = "Inoxin HA";
const SUPPORT_EMAIL = "hello@hayaalsalat.app";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate font-mono text-sm text-foreground">{value}</p>
      </div>
      <button
        onClick={copy}
        aria-label={`Copy ${label}`}
        className="shrink-0 rounded-md border border-white/10 p-1.5 text-muted-foreground transition hover:text-foreground"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function AboutPage() {
  const [ua, setUa] = useState("");
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    setUa(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setStandalone(!!isStandalone);
  }, []);

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
          {APP_NAME}
        </p>
        <h1 className="mt-2 font-display text-3xl leading-tight">About</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Version and build details for support and App Store review.
        </p>
      </header>

      <section className="space-y-3">
        <CopyRow label="App name" value={APP_NAME} />
        <CopyRow label="Version" value={APP_VERSION} />
        <CopyRow label="Build" value={APP_BUILD} />
        <CopyRow label="Bundle ID" value={BUNDLE_ID} />
        <CopyRow label="Release channel" value={RELEASE_CHANNEL} />
        <CopyRow label="Build date" value={BUILD_DATE} />
        <CopyRow label="Owner" value={OWNER} />
        <CopyRow label="Support" value={SUPPORT_EMAIL} />
        <CopyRow label="Installed as PWA" value={standalone ? "yes" : "no"} />
        {ua && <CopyRow label="User agent" value={ua} />}
      </section>

      <section className="mt-8 space-y-2 text-sm leading-relaxed text-muted-foreground">
        <h2 className="font-display text-lg text-foreground">Reference links</h2>
        <p>
          <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
          <span className="mx-2 text-muted-foreground/50">·</span>
          <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link>
          <span className="mx-2 text-muted-foreground/50">·</span>
          <Link to="/licenses" className="underline hover:text-foreground">Open Source Licenses</Link>
        </p>
        <p className="pt-4 text-xs">
          For App Store review: quote the <strong className="text-foreground">Version</strong> and{" "}
          <strong className="text-foreground">Build</strong> above when responding to reviewer
          notes. The <strong className="text-foreground">Bundle ID</strong> must match the record
          in App Store Connect.
        </p>
      </section>

      <footer className="mt-10 text-center text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70">
        ✍️ Created with care by {OWNER}
      </footer>
    </main>
  );
}
