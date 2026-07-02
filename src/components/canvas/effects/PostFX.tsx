"use client";

import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";

export default function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={0.85}
        luminanceThreshold={0.28}
        luminanceSmoothing={0.65}
        radius={0.7}
      />
      <Noise opacity={0.05} />
      <Vignette eskil={false} offset={0.22} darkness={0.85} />
    </EffectComposer>
  );
}
