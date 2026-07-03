// Shared mutable state, written by ScrollAnimation (DOM side) and read inside
// useFrame (canvas side). Plain objects keep the 60fps loop free of React
// re-renders.
export const scrollState = {
  progress: 0, // 0..1 across the whole page (raw, Lenis-smoothed)
  smooth: 0, // extra-damped copy, written by the scene's frame loop
  pointer: { x: 0, y: 0 }, // -1..1, global cursor for parallax everywhere
};
