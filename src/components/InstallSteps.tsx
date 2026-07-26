import { useEffect, useState } from "react";
import { Download, Share, Plus, Home, Smartphone, ChevronDown, ChevronUp } from "lucide-react";

type BeforeInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallSteps() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPrompt | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [expanded, setExpanded] = useState(false);


  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect if the app is already running as an installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", () => setIsInstalled(true));
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Home className="h-3.5 w-3.5" style={{ color: "var(--gold)" }} />
          Haya Al-Salat is installed on this device.
        </span>
      </div>
    );
  }

  const ua = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-5 backdrop-blur">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={expanded}
        aria-label="Show install instructions"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(140deg, var(--gold), oklch(0.65 0.14 40))" }}
          >
            <Smartphone className="h-5 w-5" style={{ color: "var(--primary-foreground)" }} />
          </div>
          <div>
            <p className="font-display text-base" style={{ color: "var(--gold-soft)" }}>
              Install Haya Al-Salat
            </p>
            <p className="text-[11px] text-muted-foreground">
              Add to Home Screen for the best experience.
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium transition active:scale-[0.98]"
              style={{
                background: "linear-gradient(140deg, var(--gold), oklch(0.65 0.14 40))",
                color: "var(--primary-foreground)",
              }}
            >
              <Download className="h-4 w-4" />
              Install now
            </button>
          ) : (
            <>
              {isIOS ? (
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
                      style={{ background: "var(--gold-soft)", color: "var(--primary-foreground)" }}
                    >
                      1
                    </span>
                    <span>
                      Open this page in <strong className="text-foreground">Safari</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
                      style={{ background: "var(--gold-soft)", color: "var(--primary-foreground)" }}
                    >
                      2
                    </span>
                    <span>
                      Tap the <Share className="mx-1 inline h-3.5 w-3.5" style={{ color: "var(--gold)" }} />{" "}
                      <strong className="text-foreground">Share</strong> button at the bottom of the screen.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
                      style={{ background: "var(--gold-soft)", color: "var(--primary-foreground)" }}
                    >
                      3
                    </span>
                    <span>
                      Scroll and tap{" "}
                      <Plus className="mx-1 inline h-3.5 w-3.5" style={{ color: "var(--gold)" }} />{" "}
                      <strong className="text-foreground">Add to Home Screen</strong>.
                    </span>
                  </li>
                </ol>
              ) : isAndroid ? (
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
                      style={{ background: "var(--gold-soft)", color: "var(--primary-foreground)" }}
                    >
                      1
                    </span>
                    <span>
                      Open this page in <strong className="text-foreground">Chrome</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
                      style={{ background: "var(--gold-soft)", color: "var(--primary-foreground)" }}
                    >
                      2
                    </span>
                    <span>
                      Tap the menu (⋮) and select{" "}
                      <strong className="text-foreground">Add to Home Screen</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
                      style={{ background: "var(--gold-soft)", color: "var(--primary-foreground)" }}
                    >
                      3
                    </span>
                    <span>Tap <strong className="text-foreground">Add</strong> when prompted.</span>
                  </li>
                </ol>
              ) : (
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
                      style={{ background: "var(--gold-soft)", color: "var(--primary-foreground)" }}
                    >
                      1
                    </span>
                    <span>
                      Open this page in your browser’s menu.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
                      style={{ background: "var(--gold-soft)", color: "var(--primary-foreground)" }}
                    >
                      2
                    </span>
                    <span>
                      Look for <strong className="text-foreground">Install</strong> or{" "}
                      <strong className="text-foreground">Add to Home Screen</strong>.
                    </span>
                  </li>
                </ol>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
