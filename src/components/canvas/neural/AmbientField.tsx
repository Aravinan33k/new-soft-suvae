"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// Faint distant dust for depth and parallax behind the neural web.
export default function AmbientField({ count = 900 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const cyan = new THREE.Color("#67e8f9");
    const blue = new THREE.Color("#7da2ff");
    const violet = new THREE.Color("#a78bfa");
    for (let i = 0; i < count; i++) {
      const r = 30 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const pick = Math.random();
      const c = pick < 0.5 ? blue : pick < 0.8 ? cyan : violet;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y += delta * 0.006;
  });

  return (
    <points ref={points} renderOrder={0} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.35}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
