"use client";

import { useSyncExternalStore } from "react";
import { FiMoon, FiSun } from "react-icons/fi";

// `dark` is derived directly from the <html data-theme> attribute via
// useSyncExternalStore + a MutationObserver — the single source of truth,
// set by the layout init script before paint and by toggle() below. No
// local state (and no setState-in-effect): flipping the attribute triggers
// the observer, which re-renders.
function subscribeTheme(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => obs.disconnect();
}
function isDark() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

// Shared theme state + toggler, driven by the <html data-theme> attribute.
// Reused by the standalone button below and by the navbar's Contact dropdown.
export function useTheme() {
  const dark = useSyncExternalStore(subscribeTheme, isDark, () => false);
  const toggle = () => {
    const next = !dark;
    if (next) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* private mode */
    }
  };
  return { dark, toggle };
}

// Light/dark switch. Light = the Warm Ivory palette, dark = the original
// Enterprise AI navy/orange look. Flips data-theme on <html> (every themed
// element reads CSS variables scoped to it) and persists the choice; the
// inline script in layout.tsx restores it before paint so there is no flash.
export default function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
      className="ml-4 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-(--border) bg-(--card) text-(--foreground) transition-all duration-300 hover:border-(--brand-orange)/50 hover:text-(--brand-orange)"
    >
      {dark ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
    </button>
  );
}
