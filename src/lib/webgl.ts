"use client";

import { useSyncExternalStore } from "react";

// True only if the browser can actually create a WebGL context. Some
// environments (sandboxed browsers, GPU disabled, blocklisted drivers,
// headless) expose the WebGL API but fail at context creation — which
// makes three.js throw "Error creating WebGL context" and can break the
// page. We probe with a throwaway canvas so callers can render a static
// fallback instead of mounting a doomed <Canvas>.
export function webglSupported(): boolean {
  if (typeof window === "undefined") return false;
  // Only check that the WebGL API EXISTS — do NOT create a probe context.
  // Creating a throwaway context is unreliable: browsers cap live WebGL
  // contexts per process (and this page + other open tabs mount several),
  // so a probe near the cap false-negatives and hides the globe behind the
  // static fallback. Every browser that has the API can run three.js; if
  // an individual context genuinely fails, three.js handles that itself.
  return (
    "WebGLRenderingContext" in window || "WebGL2RenderingContext" in window
  );
}

// Cached so getSnapshot is referentially stable across renders.
let cachedSupport: boolean | null =
  typeof window === "undefined" ? null : webglSupported();
function webglSnapshot(): boolean {
  if (cachedSupport === null) cachedSupport = webglSupported();
  return cachedSupport;
}

// Hook form: null while unknown (SSR + first client paint, so hydration
// agrees), then true/false once the client probes. WebGL support never
// changes at runtime, so the subscription is a no-op; useSyncExternalStore
// is used purely to avoid a synchronous setState inside an effect.
export function useWebGLSupported(): boolean | null {
  return useSyncExternalStore<boolean | null>(
    () => () => {},
    webglSnapshot,
    () => null,
  );
}
