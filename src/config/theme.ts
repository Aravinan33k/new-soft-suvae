// Single source of truth for scene + UI colors so canvas and DOM stay in sync.
export const COLORS = {
  background: "#0a0a0c",
  coreEmissive: "#ff8a3d",
  coreDeep: "#f9723c",
  glow: "#ffb057",
  ring: "#ff6a3d",
  accent: "#f92b4e",
  white: "#ffe0a3",
} as const;

export const FOG = {
  color: COLORS.background,
  near: 9,
  far: 26,
} as const;
