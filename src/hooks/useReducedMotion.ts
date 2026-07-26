import { useEffect, useState } from "react";

const STORAGE_KEY = "haya-reduced-motion";
type Pref = "auto" | "on" | "off";

function readPref(): Pref {
  if (typeof window === "undefined") return "auto";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "on" || v === "off" || v === "auto") return v;
  } catch {}
  return "auto";
}

function systemPrefers(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function applyToDom(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.reducedMotion = enabled ? "true" : "false";
}

export function useReducedMotion() {
  const [pref, setPrefState] = useState<Pref>("auto");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const p = readPref();
    setPrefState(p);
    const compute = () => (p === "auto" ? systemPrefers() : p === "on");
    setEnabled(compute());
    applyToDom(compute());

    if (p === "auto" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const onChange = () => {
        setEnabled(mq.matches);
        applyToDom(mq.matches);
      };
      mq.addEventListener?.("change", onChange);
      return () => mq.removeEventListener?.("change", onChange);
    }
  }, []);

  const setPref = (next: Pref) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    setPrefState(next);
    const on = next === "auto" ? systemPrefers() : next === "on";
    setEnabled(on);
    applyToDom(on);
  };

  return { pref, enabled, setPref };
}

/** Synchronous read for non-reactive callers (e.g. splash initial state). */
export function isReducedMotionInitial(): boolean {
  const p = readPref();
  if (p === "on") return true;
  if (p === "off") return false;
  return systemPrefers();
}
