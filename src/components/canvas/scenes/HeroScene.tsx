"use client";

import AICore from "@/components/canvas/core/AICore";
import ParticleField from "@/components/canvas/core/ParticleField";
import CameraRig from "@/components/canvas/core/CameraRig";
import { COLORS, FOG } from "@/config/theme";

export default function HeroScene() {
  return (
    <>
      <color attach="background" args={[COLORS.background]} />
      <fog attach="fog" args={[FOG.color, FOG.near, FOG.far]} />

      <ambientLight intensity={0.12} />
      {/* Cool rim from behind-left, faint violet fill from the right for depth */}
      <directionalLight
        position={[-6, 4, -4]}
        color={COLORS.coreEmissive}
        intensity={0.6}
      />
      <pointLight
        position={[7, -2, 3]}
        color={COLORS.accent}
        intensity={4}
        distance={16}
        decay={2}
      />

      {/* Pushed back and slightly up so the DOM copy isn't fighting the bright core */}
      <group position={[0, 0.6, -3]}>
        <AICore />
      </group>
      <ParticleField />
      <CameraRig />
    </>
  );
}
