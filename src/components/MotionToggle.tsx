import { Sparkles, Zap } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function MotionToggle() {
  const { pref, setPref } = useReducedMotion();

  const options: { value: "auto" | "off" | "on"; label: string }[] = [
    { value: "auto", label: "Auto" },
    { value: "off", label: "Full" },
    { value: "on", label: "Reduced" },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        <Sparkles className="h-3 w-3" style={{ color: "var(--gold)" }} />
        <span>Motion</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground normal-case tracking-normal">
        Shorten or disable animations for a calmer experience.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const active = pref === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPref(opt.value)}
              aria-pressed={active}
              className="rounded-full border px-3 py-2 text-xs font-medium transition-colors"
              style={{
                borderColor: active ? "var(--gold)" : "oklch(1 0 0 / 0.12)",
                background: active ? "oklch(0.82 0.13 85 / 0.15)" : "transparent",
                color: active ? "var(--gold)" : "var(--foreground)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground normal-case tracking-normal">
        <Zap className="h-2.5 w-2.5" />
        Auto follows your device's reduce-motion setting.
      </p>
    </div>
  );
}
