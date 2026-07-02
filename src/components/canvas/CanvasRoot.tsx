"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import BlackHoleScene from "@/components/canvas/scenes/BlackHoleScene";
import Effects from "@/components/canvas/effects/Effects";

export default function CanvasRoot() {
  return (
    <Canvas
      camera={{ fov: 50, near: 0.1, far: 200, position: [0, 0.9, 16] }}
      dpr={[1, 1.5]}
      gl={{
        antialias: false, // post chain handles smoothing
        powerPreference: "high-performance",
      }}
      className="absolute! inset-0"
    >
      <Suspense fallback={null}>
        <BlackHoleScene />
        <Effects />
      </Suspense>
    </Canvas>
  );
}
