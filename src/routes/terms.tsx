import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Haya Al-Salat" },
      {
        name: "description",
        content:
          "Terms of Service for Haya Al-Salat: user responsibilities, acceptable use, and liability.",
      },
      { property: "og:title", content: "Terms of Service — Haya Al-Salat" },
      {
        property: "og:description",
        content:
          "Terms of Service for Haya Al-Salat: user responsibilities, acceptable use, and liability.",
      },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: TermsPage,
});

const LAST_UPDATED = "July 26, 2026";
const CONTACT_EMAIL = "hello@hayaalsalat.app"; // TODO: replace with your real contact address

function TermsPage() {
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
        <h1 className="mt-2 font-display text-3xl leading-tight">Terms of Service</h1>
        <p className="mt-2 text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          These Terms of Service govern your use of Haya Al-Salat, a peaceful Fajr companion
          operated by the app owner (Inoxin HA). By installing or using the app, you agree to these
          terms. If you do not agree, please do not use the app.
        </p>

        <div>
          <h2 className="mb-2 font-display text-lg text-foreground">1. What the app provides</h2>
          <p>
            Haya Al-Salat displays local prayer times, plays the Adhan, and can gently begin the
            recitation of Surat Al-Mu'minun by Mukhtar Al-Hajj before Fajr. Prayer times are
            calculated by the third-party Aladhan API based on your location. Times are provided for
            guidance only and should be verified against your local mosque or authoritative source.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-foreground">2. User responsibilities</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              You are responsible for ensuring the app is set to the correct location, timezone, and
              reminder preferences for your circumstances.
            </li>
            <li>
              You are responsible for keeping your device charged, connected, and sufficiently
              unmuted so that reminders and audio can be heard.
            </li>
            <li>
              You may not use the app or its content for unlawful, harmful, or infringing purposes.
            </li>
            <li>
              You may not reverse-engineer, decompile, or redistribute the app or its audio content
              without permission.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-foreground">3. Acceptable use</h2>
          <p>
            You agree to use Haya Al-Salat respectfully and in compliance with all applicable laws.
            Do not attempt to overload, disrupt, or scrape the app's services or APIs. Do not submit
            false location data or abuse notification features.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-foreground">4. Intellectual property</h2>
          <p>
            The app design, code, branding, and compiled assets are owned by the app owner. The
            recitation of Surat Al-Mu'minun by Mukhtar Al-Hajj and the prayer-time calculations
            remain the property of their respective owners and are used under public or
            license-permitted terms. You receive a limited, non-exclusive, non-transferable license
            to use the app for personal, non-commercial purposes.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-foreground">5. Disclaimers</h2>
          <p>
            Haya Al-Salat is provided "as is" without warranties of any kind. We do not guarantee
            that prayer times, notifications, or audio playback will always be accurate, complete,
            or uninterrupted. Reliance on the app is at your own discretion.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-foreground">6. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, the app owner shall not be liable for any
            direct, indirect, incidental, special, or consequential damages arising from your use of
            or inability to use the app, including missed prayers, missed reminders, or reliance on
            incorrect prayer times.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-foreground">7. Changes to these terms</h2>
          <p>
            We may update these Terms of Service from time to time. Continued use of the app after
            changes means you accept the revised terms. The "Last updated" date at the top of this
            page indicates when the latest changes were made.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-lg text-foreground">8. Contact</h2>
          <p>
            Questions about these terms? Email{" "}
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
