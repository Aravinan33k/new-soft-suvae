"use client";

import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";

// Deliberately minimal chain: no chromatic aberration, no film grain —
// both trade sharpness for mood, and this scene prioritizes clarity.
export default function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={0.55}
        luminanceThreshold={0.32}
        luminanceSmoothing={0.5}
        radius={0.5}
      />
      <Vignette eskil={false} offset={0.2} darkness={0.9} />
    </EffectComposer>
  );
}
