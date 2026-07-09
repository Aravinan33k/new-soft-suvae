"use client";

import { useSyncExternalStore } from "react";

// Reads the prefers-reduced-motion media query via useSyncExternalStore —
// the idiomatic way to subscribe to an external store, with no synchronous
// setState inside an effect (which the React Compiler flags). Server
// snapshot is `false` (motion on) to match the pre-hydration default, so
// components should DERIVE their reduced-motion behaviour in render rather
// than setting state in an effect.
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
