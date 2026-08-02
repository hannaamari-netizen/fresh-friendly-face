import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy, ExternalLink, Terminal } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/xcode-setup")({
  head: () => ({
    meta: [
      { title: "Xcode Setup Wizard — Haya Al-Salat" },
      {
        name: "description",
        content:
          "Step-by-step wizard for downloading the correct Xcode .xip, extracting it, and pointing xcode-select at it before publishing Haya Al-Salat to the App Store.",
      },
      { property: "og:title", content: "Xcode Setup Wizard — Haya Al-Salat" },
      {
        property: "og:description",
        content:
          "Download, extract, and select Xcode on your Mac so the Haya Al-Salat publish command can archive and upload the build.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: XcodeSetupPage,
});

const STORAGE_KEY = "haya-xcode-wizard-done";

type Step = {
  id: string;
  title: string;
  body: string[];
  commands?: string[];
  link?: { href: string; label: string };
  note?: string;
};

const STEPS: Step[] = [
  {
    id: "space",
    title: "Check free disk space",
    body: [
      "Xcode needs about 15 GB installed, and roughly 40 GB free while the .xip is downloaded and expanded.",
      "Run this in Terminal and read the “Avail” column.",
    ],
    commands: ["df -h /"],
    note: "If you have less than 40 GB free, empty the Trash and remove old iOS simulators first.",
  },
  {
    id: "version",
    title: "Pick the right Xcode version",
    body: [
      "You are on macOS Sequoia 15.7.x, which supports Xcode 16.x. Do not download Xcode 26/beta builds — they require a newer macOS.",
      "Sign in with the Apple ID that holds your Developer Program membership, then open the Xcode section of the downloads list.",
    ],
    link: {
      href: "https://developer.apple.com/download/all/?q=xcode",
      label: "Open Apple Developer downloads",
    },
    note: "Use Safari. Right-click the Xcode 16.x row → Copy Link to grab the .xip URL.",
  },
  {
    id: "download",
    title: "Download the .xip (resumable)",
    body: [
      "Browser downloads of a 10 GB+ file often stall. curl with -C - resumes exactly where it stopped, so you can re-run the same command as many times as needed.",
      "Paste the link you copied in place of PASTE_LINK.",
    ],
    commands: ["cd ~/Downloads", 'curl -L -C - -O "PASTE_LINK"'],
    note: "If it stalls, press Ctrl+C and run the same curl command again — it continues from the same byte.",
  },
  {
    id: "verify",
    title: "Verify the download finished",
    body: [
      "A truncated .xip fails silently during expansion. Check the size (Xcode 16 is ~11 GB) and that the archive signature is valid.",
    ],
    commands: ["ls -lh ~/Downloads/Xcode*.xip", "pkgutil --check-signature ~/Downloads/Xcode*.xip"],
    note: "The signature check must say “signed by Apple”. If not, delete the file and re-download.",
  },
  {
    id: "extract",
    title: "Extract the archive",
    body: [
      "Expanding takes 10–40 minutes and shows no progress bar. Do not interrupt it and keep the Mac awake.",
    ],
    commands: ["cd ~/Downloads", "xip --expand Xcode*.xip", "caffeinate -i -w $$"],
  },
  {
    id: "move",
    title: "Move Xcode into /Applications",
    body: [
      "The toolchain scripts expect Xcode at /Applications/Xcode.app.",
    ],
    commands: ["sudo mv ~/Downloads/Xcode.app /Applications/Xcode.app"],
  },
  {
    id: "select",
    title: "Point xcode-select at Xcode",
    body: [
      "By default the Mac uses the slim CommandLineTools, which cannot archive an iOS app. Select the full Xcode, finish first launch, and accept the license.",
    ],
    commands: [
      "sudo xcode-select -s /Applications/Xcode.app/Contents/Developer",
      "sudo xcodebuild -runFirstLaunch",
      "sudo xcodebuild -license accept",
      "xcode-select -p",
      "xcodebuild -version",
    ],
    note: "xcode-select -p must print /Applications/Xcode.app/Contents/Developer.",
  },
  {
    id: "signin",
    title: "Sign in and set your team",
    body: [
      "Open Xcode → Settings → Accounts → “+” → Apple ID, then confirm team D47J65KQXJ appears.",
      "Xcode creates the signing certificate automatically the first time you archive.",
    ],
    commands: ["security find-identity -v -p codesigning"],
  },
  {
    id: "preflight",
    title: "Run preflight, then publish",
    body: [
      "Preflight re-checks Xcode, the bundle id app.hayaalsalat.companion, team D47J65KQXJ, and Info.plist keys. Fix anything it flags before publishing.",
    ],
    commands: ["bun install", "bun run mobile:preflight", "bun run mobile:publish"],
    note: "mobile:publish runs preflight → store-copy check → archive → upload to App Store Connect.",
  },
];

function CommandLine({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
      <code className="min-w-0 flex-1 break-all font-mono text-[12px] leading-relaxed text-amber-100/90">
        {cmd}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy command: ${cmd}`}
        className="shrink-0 rounded-md border border-white/10 p-1.5 text-muted-foreground transition hover:text-foreground"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function XcodeSetupPage() {
  const [done, setDone] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved: string[] = raw ? JSON.parse(raw) : [];
      setDone(saved);
      const next = STEPS.findIndex((s) => !saved.includes(s.id));
      setCurrent(next === -1 ? STEPS.length - 1 : next);
    } catch {
      /* ignore */
    }
  }, []);

  function persist(next: string[]) {
    setDone(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function complete(id: string, index: number) {
    if (!done.includes(id)) persist([...done, id]);
    if (index < STEPS.length - 1) setCurrent(index + 1);
  }

  function reset() {
    persist([]);
    setCurrent(0);
  }

  const completed = STEPS.filter((s) => done.includes(s.id)).length;
  const pct = Math.round((completed / STEPS.length) * 100);

  return (
    <main className="relative min-h-dvh w-full safe-px">
      <div
        className="mx-auto w-full max-w-md px-6"
        style={{
          paddingTop: "calc(2rem + env(safe-area-inset-top))",
          paddingBottom: "calc(3rem + env(safe-area-inset-bottom))",
        }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        <header className="mt-6">
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Terminal className="h-3.5 w-3.5" />
            Publishing toolchain
          </p>
          <h1 className="mt-2 font-display text-2xl leading-tight">Xcode setup wizard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Nine steps from an empty Mac to <code className="font-mono text-xs">bun run mobile:publish</code>.
            Your progress is saved on this device.
          </p>
        </header>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {completed} of {STEPS.length} done
            </span>
            <button
              type="button"
              onClick={reset}
              className="uppercase tracking-[0.2em] transition hover:text-foreground"
            >
              Reset
            </button>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: "var(--gold)" }}
            />
          </div>
        </div>

        <ol className="mt-6 space-y-3">
          {STEPS.map((step, i) => {
            const isDone = done.includes(step.id);
            const isOpen = current === i;
            return (
              <li
                key={step.id}
                className="overflow-hidden rounded-2xl border transition"
                style={{
                  borderColor: isOpen ? "oklch(0.82 0.13 85 / 0.45)" : "oklch(1 0 0 / 0.1)",
                  background: isOpen ? "oklch(1 0 0 / 0.04)" : "oklch(0 0 0 / 0.2)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setCurrent(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold"
                    style={{
                      borderColor: isDone ? "var(--gold)" : "oklch(1 0 0 / 0.2)",
                      color: isDone ? "var(--gold)" : "var(--muted-foreground)",
                    }}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-sm">{step.title}</span>
                </button>

                {isOpen && (
                  <div className="space-y-3 px-4 pb-4">
                    {step.body.map((p) => (
                      <p key={p} className="text-[13px] leading-relaxed text-muted-foreground">
                        {p}
                      </p>
                    ))}

                    {step.link && (
                      <a
                        href={step.link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[13px] transition hover:bg-white/5"
                      >
                        {step.link.label}
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    )}

                    {step.commands && (
                      <div className="space-y-2">
                        {step.commands.map((c) => (
                          <CommandLine key={c} cmd={c} />
                        ))}
                      </div>
                    )}

                    {step.note && (
                      <p className="rounded-xl border border-amber-200/20 bg-amber-200/[0.06] px-3 py-2 text-[12px] leading-relaxed text-amber-100/80">
                        {step.note}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => complete(step.id, i)}
                      className="w-full rounded-xl border px-4 py-2.5 text-xs uppercase tracking-[0.2em] transition"
                      style={{ borderColor: "var(--gold)", color: "var(--gold)" }}
                    >
                      {i === STEPS.length - 1 ? "Finish" : "Mark done & continue"}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <p className="mt-8 text-center text-[11px] text-muted-foreground/70">
          Team ID <span className="font-mono">D47J65KQXJ</span> · Bundle{" "}
          <span className="font-mono">app.hayaalsalat.companion</span>
        </p>
      </div>
    </main>
  );
}
