import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, Mail, MapPin, Bell, BarChart3, Server, Lock, Baby, FilePenLine } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Haya Al-Salat" },
      {
        name: "description",
        content:
          "Privacy Policy for Haya Al-Salat. Learn how we handle your location, notifications, and personal data.",
      },
      { property: "og:title", content: "Privacy Policy — Haya Al-Salat" },
      {
        property: "og:description",
        content:
          "Privacy Policy for Haya Al-Salat. Learn how we handle your location, notifications, and personal data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: PrivacyPage,
});

const EFFECTIVE_DATE = "August 2026";
const CONTACT_EMAIL = "support@hayaalsalat.com";

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

      <header className="mb-10">
        <p
          className="text-[11px] uppercase tracking-[0.3em]"
          style={{ color: "var(--gold-soft)" }}
        >
          Haya Al-Salat
        </p>
        <h1 className="mt-2 font-display text-3xl leading-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Effective Date: {EFFECTIVE_DATE}
        </p>
      </header>

      <section className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <p className="text-base text-foreground/90">
          Haya Al-Salat respects your privacy. This policy explains what information the app
          handles, how it is used, and the choices available to you.
        </p>

        <PolicySection icon={Shield} title="Information We Collect">
          <ul className="list-disc space-y-2 pl-5">
            <li>We do not require users to create an account.</li>
            <li>We do not sell or share personal information.</li>
            <li>
              Prayer times, Qibla direction, reminders, and calendar features work locally or by
              using trusted public services.
            </li>
          </ul>
        </PolicySection>

        <PolicySection icon={MapPin} title="Location">
          <p>
            If the user grants permission, location is used only to calculate accurate prayer times
            and Qibla direction. Location data is never sold.
          </p>
        </PolicySection>

        <PolicySection icon={Bell} title="Notifications">
          <p>
            The app uses local notifications only for prayer reminders selected by the user. These
            alerts are scheduled on the device and are not sent to any server.
          </p>
        </PolicySection>

        <PolicySection icon={BarChart3} title="Analytics">
          <p>
            We do not collect personal analytics or advertising identifiers. No behavioral or
            demographic data is gathered for marketing purposes.
          </p>
        </PolicySection>

        <PolicySection icon={Server} title="Third Parties">
          <p>
            The app may use Apple services required for app functionality, such as push
            notification delivery and app distribution. These services operate under their own
            privacy terms.
          </p>
        </PolicySection>

        <PolicySection icon={Lock} title="Data Security">
          <p>
            We take reasonable measures to protect user information. Sensitive operations are
            performed on the device whenever possible, and data sent to trusted services is limited to
            what is necessary for the requested feature.
          </p>
        </PolicySection>

        <PolicySection icon={Baby} title="Children's Privacy">
          <p>
            The app is suitable for all ages and does not knowingly collect personal information
            from children.
          </p>
        </PolicySection>

        <PolicySection icon={FilePenLine} title="Changes to This Policy">
          <p>
            This policy may be updated from time to time. Any changes will be posted on this page with
            an updated effective date. Continued use of the app after changes constitutes acceptance
            of the revised policy.
          </p>
        </PolicySection>

        <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg text-foreground">
            <Mail className="h-4 w-4" style={{ color: "var(--gold-soft)" }} />
            Contact
          </h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline transition hover:text-foreground"
              style={{ color: "var(--gold-soft)" }}
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </section>

      <footer className="mt-12 text-center text-[11px] uppercase tracking-[0.3em] text-muted-foreground/70">
        ✍️ Created with care by Inoxin HA
      </footer>
    </main>
  );
}

function PolicySection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg text-foreground">
        <Icon className="h-4 w-4" style={{ color: "var(--gold-soft)" }} />
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
