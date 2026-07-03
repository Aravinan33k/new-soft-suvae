"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { scrollState } from "@/lib/scrollState";

// Cinematic camera: never static. It orbits the core while the scroll both
// tightens the orbit (flying in to reveal the assembled web) and swings the
// angle around. Pointer adds a gentle parallax sway. Frame-rate-independent
// damping keeps every move buttery.

// Radius / height keyframes across the box scroll (0..1): fly in, reveal the
// web, orbit, then push into the assembled core.
const KEYS = [
  { at: 0.0, r: 20, h: 3.2 },
  { at: 0.25, r: 13, h: 1.4 },
  { at: 0.5, r: 15, h: 1.0 },
  { at: 0.75, r: 12.5, h: 3.0 },
  { at: 1.0, r: 11, h: 0.6 },
];

function sample(s: number, prop: "r" | "h") {
  if (s <= KEYS[0].at) return KEYS[0][prop];
  if (s >= KEYS[KEYS.length - 1].at) return KEYS[KEYS.length - 1][prop];
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i];
    const b = KEYS[i + 1];
    if (s >= a.at && s <= b.at) {
      const t = (s - a.at) / (b.at - a.at);
      const e = t * t * (3 - 2 * t); // smoothstep
      return a[prop] + (b[prop] - a[prop]) * e;
    }
  }
  return KEYS[KEYS.length - 1][prop];
}

export default function NeuralCamera() {
  const smooth = useRef(0);

  useFrame(({ camera, clock }, delta) => {
    const damp = 1 - Math.exp(-3 * delta);
    smooth.current += (scrollState.progress - smooth.current) * damp;
    const s = smooth.current;
    const time = clock.getElapsedTime();

    const r = sample(s, "r");
    const h = sample(s, "h");
    const angle = s * Math.PI * 1.4 + time * 0.05;

    // Global pointer (works under the layered HTML content) for gentle sway
    const px = scrollState.pointer.x;
    const py = scrollState.pointer.y;
    const targetX = Math.sin(angle) * r + px * 0.6;
    const targetZ = Math.cos(angle) * r;
    const targetY = h + py * 0.4;

    camera.position.x += (targetX - camera.position.x) * damp;
    camera.position.y += (targetY - camera.position.y) * damp;
    camera.position.z += (targetZ - camera.position.z) * damp;
    camera.lookAt(0, 0, 0);
  });

  return null;
}
