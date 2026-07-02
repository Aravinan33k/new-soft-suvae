// react-three-fiber still constructs THREE.Clock internally, which three
// r185+ reports as deprecated. Nothing in our code uses Clock; until R3F
// migrates to THREE.Timer upstream, drop that one warning so the console
// stays clean. Everything else passes through untouched.
let patched = false;

export function silenceKnownWarnings() {
  if (patched || typeof window === "undefined") return;
  patched = true;

  const original = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].startsWith("THREE.Clock: This module has been deprecated")
    ) {
      return;
    }
    original(...args);
  };
}
