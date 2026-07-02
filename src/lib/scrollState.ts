// Shared mutable scroll state, written by ScrollAnimation (DOM side) and
// read inside useFrame (canvas side). A plain object keeps the 60fps loop
// free of React re-renders.
export const scrollState = {
  progress: 0, // 0..1 across the whole page (raw, Lenis-smoothed)
  smooth: 0, // extra-damped copy, written by BlackHole's frame loop
};
