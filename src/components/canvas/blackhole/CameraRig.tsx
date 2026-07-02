"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { scrollState } from "@/lib/scrollState";

const START_Z = 16;
const END_Z = 11.5;
const BASE_Y = 0.9;

// Scroll pushes the camera toward the hole; the pointer adds a small
// parallax sway. Frame-rate-independent damping keeps both buttery.
export default function CameraRig() {
  const smooth = useRef(0);

  useFrame(({ camera, pointer }, delta) => {
    const damp = 1 - Math.exp(-3 * delta);
    smooth.current += (scrollState.progress - smooth.current) * damp;

    const targetZ = START_Z + (END_Z - START_Z) * smooth.current;
    const targetX = pointer.x * 0.55;
    const targetY = BASE_Y + pointer.y * 0.35;

    camera.position.z += (targetZ - camera.position.z) * damp;
    camera.position.x += (targetX - camera.position.x) * damp;
    camera.position.y += (targetY - camera.position.y) * damp;
    camera.lookAt(0, 0, 0);
  });

  return null;
}
