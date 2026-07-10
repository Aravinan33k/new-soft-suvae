// Scroll-linked reveal controller.
//
// The old pattern across the site was a fire-once IntersectionObserver: an
// element snapped from hidden → shown the instant it crossed a threshold, so
// every section "popped" independently — the page read as a stack of separate
// slides. This drives a single, shared `--rv` progress value (0 → 1) that is
// tied CONTINUOUSLY to each element's position in the viewport. As you scroll,
// content rises, de-blurs and settles in lock-step with the scroll itself, so
// one section hands off to the next instead of flipping to it.
//
// One rAF loop services every registered element; each frame it writes a single
// custom property (`--rv`) and CSS does the rest. Cheap enough for the whole
// page. Reversible: scroll back up and the reveal plays backwards, which is what
// makes the motion feel welded to the scroll rather than triggered by it.

type RevealOptions = {
  /** viewport-height fraction where reveal begins (element top, 0 = top). */
  start?: number;
  /** viewport-height fraction where the element is fully revealed. */
  end?: number;
};

type Entry = {
  el: HTMLElement;
  start: number;
  end: number;
  cur: number; // eased current progress
};

const entries = new Set<Entry>();
let raf = 0;
let running = false;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

function frame() {
  const vh = window.innerHeight || 1;
  for (const e of entries) {
    const top = e.el.getBoundingClientRect().top;
    const startY = vh * e.start;
    const endY = vh * e.end;
    // top travels from startY (progress 0) up to endY (progress 1) as you
    // scroll down; clamped so it holds at 1 once past and 0 before.
    const raw = clamp01((startY - top) / (startY - endY || 1));
    const target = easeOutCubic(raw);
    // Light extra easing so even a fast flick lands softly — reinforces the
    // "continuous handoff" feel on top of Lenis's own scroll smoothing.
    e.cur += (target - e.cur) * 0.18;
    if (Math.abs(target - e.cur) < 0.0008) e.cur = target;
    e.el.style.setProperty("--rv", e.cur.toFixed(4));
  }
  raf = requestAnimationFrame(frame);
}

/**
 * Register an element to receive a scroll-linked `--rv` (0 → 1) custom
 * property. CSS on the element (or its children, which inherit the property)
 * maps `--rv` to opacity / transform / blur. Returns an unobserve cleanup.
 */
export function observeReveal(
  el: HTMLElement,
  { start = 0.9, end = 0.58 }: RevealOptions = {},
): () => void {
  const entry: Entry = { el, start, end, cur: 0 };
  el.style.setProperty("--rv", "0"); // no flash before the first frame
  entries.add(entry);
  if (!running) {
    running = true;
    raf = requestAnimationFrame(frame);
  }
  return () => {
    entries.delete(entry);
    if (entries.size === 0) {
      cancelAnimationFrame(raf);
      running = false;
    }
  };
}
