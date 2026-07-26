import { useEffect, useState } from "react";
import { Moon } from "lucide-react";
import { isReducedMotionInitial } from "@/hooks/useReducedMotion";

const SEEN_KEY = "haya-splash-seen-session";

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [reduced] = useState(() => isReducedMotionInitial());

  useEffect(() => {
    setMounted(true);
    if (reduced) {
      setVisible(false);
      try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
      return;
    }
    const hideTimer = setTimeout(() => setFadeOut(true), 2200);
    const removeTimer = setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {}
    }, 2900);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [reduced]);

  if (!mounted || !visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, oklch(0.28 0.08 280) 0%, oklch(0.14 0.05 275) 45%, oklch(0.08 0.03 270) 100%)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
      aria-hidden="true"
    >
      {/* Animated stars */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white/70"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.2,
              animation: `splash-twinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Glow ring */}
      <div
        className="absolute h-72 w-72 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.85 0.14 85 / 0.35) 0%, transparent 70%)",
          animation: "splash-glow 2.4s ease-out forwards",
        }}
      />

      {/* Crescent icon */}
      <div
        className="relative z-10 mb-6 flex h-24 w-24 items-center justify-center rounded-full"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.88 0.16 85) 0%, oklch(0.72 0.14 60) 100%)",
          boxShadow: "0 0 60px oklch(0.85 0.16 85 / 0.5)",
          animation: "splash-rise 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
        }}
      >
        <Moon className="h-12 w-12 text-[oklch(0.14_0.05_275)]" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h1
        className="relative z-10 text-4xl tracking-wide"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 500,
          background:
            "linear-gradient(90deg, oklch(0.92 0.12 90), oklch(0.78 0.14 70), oklch(0.92 0.12 90))",
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "splash-fade-up 1.2s 0.3s ease-out both, splash-shimmer 3s linear infinite",
        }}
      >
        Haya Al-Salat
      </h1>

      <p
        className="relative z-10 mt-2 text-sm text-white/60"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          animation: "splash-fade-up 1.2s 0.6s ease-out both",
        }}
      >
        A Peaceful Fajr Companion
      </p>

      {/* Arabic invocation */}
      <p
        className="relative z-10 mt-8 text-lg text-[oklch(0.85_0.12_85)]/80"
        style={{
          fontFamily: "'Amiri', serif",
          animation: "splash-fade-up 1.2s 0.9s ease-out both",
        }}
      >
        بِسْمِ اللَّهِ
      </p>

      <style>{`
        @keyframes splash-rise {
          0% { opacity: 0; transform: translateY(20px) scale(0.8); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes splash-fade-up {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes splash-glow {
          0% { opacity: 0; transform: scale(0.6); }
          60% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.6; transform: scale(1); }
        }
        @keyframes splash-twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
