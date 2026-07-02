"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ScreenQuad } from "@react-three/drei";
import { blackHoleFragment, blackHoleVertex } from "@/shaders/blackhole";
import { scrollState } from "@/lib/scrollState";

// Fullscreen raymarched pass: event horizon, lensed accretion disk,
// photon ring and volumetric halo all come from one shader. Renders
// after the starfield (renderOrder 1) so empty space stays transparent
// and stars show through, while the shadow occludes them.
export default function BlackHole() {
  const material = useRef<THREE.ShaderMaterial>(null);
  const smoothScroll = useRef(0);
  const basis = useMemo(() => new THREE.Matrix3(), []);

  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  const uniforms = useMemo(
    () => ({
      uCamPos: { value: new THREE.Vector3() },
      uCamBasis: { value: new THREE.Matrix3() },
      uTanHalfFov: { value: 0.5 },
      uAspect: { value: 1 },
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uPulse: { value: 1 },
      uSteps: { value: isMobile ? 110 : 200 },
      uParallax: { value: new THREE.Vector2() },
    }),
    [isMobile]
  );

  useFrame(({ camera, size, clock, pointer }, delta) => {
    const mat = material.current;
    if (!mat) return;

    const persp = camera as THREE.PerspectiveCamera;
    mat.uniforms.uCamPos.value.copy(camera.position);
    basis.setFromMatrix4(camera.matrixWorld);
    mat.uniforms.uCamBasis.value.copy(basis);
    mat.uniforms.uTanHalfFov.value = Math.tan(
      THREE.MathUtils.degToRad(persp.fov / 2)
    );
    mat.uniforms.uAspect.value = size.width / size.height;

    const t = clock.getElapsedTime();
    mat.uniforms.uTime.value = t;
    mat.uniforms.uPulse.value = 1 + Math.sin(t * 0.55) * 0.08;

    // Extra damping on top of Lenis for buttery scroll-linked rotation
    const damp = 1 - Math.exp(-4.5 * delta);
    smoothScroll.current +=
      (scrollState.progress - smoothScroll.current) * damp;
    mat.uniforms.uScroll.value = smoothScroll.current;

    mat.uniforms.uParallax.value.lerp(
      new THREE.Vector2(pointer.x, pointer.y),
      damp
    );
  });

  return (
    <ScreenQuad renderOrder={1}>
      <shaderMaterial
        ref={material}
        vertexShader={blackHoleVertex}
        fragmentShader={blackHoleFragment}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </ScreenQuad>
  );
}
