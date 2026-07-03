// Single source of truth for scene + UI colors so canvas and DOM stay in sync.
export const COLORS = {
  background: "#0b1220",
  coreEmissive: "#38bdf8",
  coreDeep: "#0ea5e9",
  glow: "#7dd3fc",
  ring: "#22d3ee",
  accent: "#8b5cf6",
  white: "#e0f2fe",
} as const;

export const FOG = {
  color: COLORS.background,
  near: 9,
  far: 26,
} as const;
