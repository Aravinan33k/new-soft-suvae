"use client";

import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";

export default function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={0.7}
        luminanceThreshold={0.32}
        luminanceSmoothing={0.5}
        radius={0.7}
      />
      <ChromaticAberration offset={[0.0006, 0.0003]} />
      <Noise opacity={0.045} />
      <Vignette eskil={false} offset={0.2} darkness={0.9} />
    </EffectComposer>
  );
}
