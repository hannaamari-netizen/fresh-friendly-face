import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { markWhatsNewSeen, shouldShowWhatsNew } from "@/routes/whats-new";

/**
 * One-time "What's New" banner shown on the home page after an app update.
 * Disappears once the user opens the What's New screen or dismisses it.
 * Rendered only after mount to avoid hydration mismatches.
 */
export function WhatsNewBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShowWhatsNew());
  }, []);

  if (!visible) return null;

  return (
    <div className="mx-auto mb-4 flex w-full max-w-md items-center gap-3 rounded-2xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-left backdrop-blur">
      <Sparkles className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Version 1.2 is here</p>
        <Link
          to="/whats-new"
          onClick={markWhatsNewSeen}
          className="text-sm text-amber-600 underline underline-offset-2 dark:text-amber-400"
        >
          See what's new
        </Link>
      </div>
      <button
        type="button"
        aria-label="Dismiss what's new"
        onClick={() => {
          markWhatsNewSeen();
          setVisible(false);
        }}
        className="rounded-full p-1 text-muted-foreground hover:bg-foreground/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
