"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import HeroScene from "@/components/canvas/scenes/HeroScene";
import PostFX from "@/components/canvas/effects/PostFX";

export default function CanvasRoot() {
  return (
    <Canvas
      camera={{ fov: 42, near: 0.1, far: 60, position: [0, 0.35, 11] }}
      dpr={[1, 1.75]}
      gl={{
        antialias: false, // post-processing chain handles smoothing
        powerPreference: "high-performance",
      }}
      className="!absolute inset-0"
    >
      <Suspense fallback={null}>
        <HeroScene />
        <PostFX />
      </Suspense>
    </Canvas>
  );
}
