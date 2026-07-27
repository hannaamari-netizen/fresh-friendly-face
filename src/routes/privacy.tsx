import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Haya Al-Salat" },
      {
        name: "description",
        content:
          "How Haya Al-Salat handles location, notifications, and audio data on your device.",
      },
      { property: "og:title", content: "Privacy Policy — Haya Al-Salat" },
      {
        property: "og:description",
        content:
          "How Haya Al-Salat handles location, notifications, and audio data on your device.",
      },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: PrivacyPage,
});

const LAST_UPDATED = "July 26, 2026";
const CONTACT_EMAIL = "hello@hayaalsalat.app"; // TODO: replace with your real contact address

function PrivacyPage() {
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
        <h1 className="mt-2 font-display text-3xl leading-tight">Privacy Policy</h1>
        <p className="mt-2 text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          Haya Al-Salat is a peaceful companion that gently prepares Muslims to wake for Fajr
          through the recitation of Surat Al-Mu'minun by Mukhtar Al-Hajj. This page explains what
          the app does with your data. It is maintained by the app owner (Inoxin HA) and is not an
          independent certification.
        </p>

        <div>
          <h2 className="mb-2 font-display text-lg text-foreground">Information we handle</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="text-foreground">Location:</strong> If you allow it, your device's
              approximate coordinates are sent to the Aladhan prayer-times API to compute your
              local Fajr time. Coordinates are not stored on our servers with your identity.
            </li>
            <li>
              <strong className="text-foreground">Notifications:</strong> If you enable Fajr
              reminders, we store a browser push subscription (a random endpoint issued by your
              OS/browser) together with your timezone, offset preference, and custom reminder text
              so the scheduler can wake your device at the right time.
            </li>
            <li>
              <strong className="text-foreground">On-device preferences:</strong> Volume, snooze
              duration, fade-in length, reminder text, and the saved recitation audio live in your
              device's local storage and cache. They never leave the device.
            </li>
            <li>
              <strong className="text-foreground">No accounts, no analytics trackers,</strong> no
              advertising IDs, and no sale of personal data.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-foreground">Third-party services</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <a
                href="https://aladhan.com/prayer-times-api"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-foreground"
              >
                Aladhan Prayer Times API
              </a>{" "}
              — receives your coordinates to return prayer times.
            </li>
            <li>
              Recitation audio is streamed from a public archive of Mukhtar Al-Hajj's recitation.
            </li>
            <li>
              Push notifications are delivered through your browser vendor's push service (Apple,
              Google, or Mozilla), which relays messages to your device.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-foreground">Permissions the app requests</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="text-foreground">Location</strong> — only to compute local Fajr.
              You can decline; you'll simply need to enter your city manually if that option is
              offered.
            </li>
            <li>
              <strong className="text-foreground">Notifications</strong> — only used to send Fajr
              reminders. Revoke anytime in your device settings.
            </li>
            <li>
              <strong className="text-foreground">Storage</strong> — used only to cache the
              recitation audio for weak-connection playback.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-foreground">Your choices</h2>
          <p>
            Disable reminders in the app to delete your push subscription from our scheduler. Clear
            your browser's site data (or uninstall the app) to remove all locally stored
            preferences and cached audio. No further action is required.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-foreground">Children</h2>
          <p>
            Haya Al-Salat is a general-audience spiritual companion. It does not knowingly collect
            data from children.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-foreground">Changes to this policy</h2>
          <p>
            If we change how the app handles data, we'll update this page and the "Last updated"
            date above.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-foreground">Contact</h2>
          <p>
            Questions or requests about your data? Email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline hover:text-foreground"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </section>

      <footer className="mt-10 text-center text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70">
        ✍️ Created with care by Inoxin HA
      </footer>
    </main>
  );
}
