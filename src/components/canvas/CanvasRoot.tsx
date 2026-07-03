"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import NeuralScene from "@/components/canvas/scenes/NeuralScene";
import Effects from "@/components/canvas/effects/Effects";
import { silenceKnownWarnings } from "@/lib/silenceKnownWarnings";

silenceKnownWarnings();

export default function CanvasRoot() {
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <Canvas
      camera={{ fov: 50, near: 0.1, far: 200, position: [0, 0.9, 16] }}
      // Desktop floor of 1.5 forces supersampling on 1x displays — the
      // raymarched disk edges and photon ring stay razor sharp
      dpr={isMobile ? [1, 1.75] : [1.5, 2.5]}
      gl={{
        antialias: false, // post chain handles smoothing
        powerPreference: "high-performance",
      }}
      className="absolute! inset-0"
    >
      <Suspense fallback={null}>
        <NeuralScene />
        <Effects />
      </Suspense>
    </Canvas>
  );
}
