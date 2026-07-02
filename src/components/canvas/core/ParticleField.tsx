"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { COLORS } from "@/config/theme";

// One draw call for the whole field: positions and colors are baked into
// buffer attributes once, motion is a cheap whole-object rotation.
export default function ParticleField() {
  const points = useRef<THREE.Points>(null);

  const count =
    typeof window !== "undefined" && window.innerWidth < 768 ? 1800 : 4500;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color(COLORS.coreEmissive),
      new THREE.Color(COLORS.glow),
      new THREE.Color("#3b82f6"),
      new THREE.Color(COLORS.white),
    ];
    for (let i = 0; i < count; i++) {
      // Hollow sphere distribution: depth all around, nothing crowding the core
      const radius = 3.5 + Math.pow(Math.random(), 0.6) * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7;
      pos[i * 3 + 2] = radius * Math.cos(phi);

      const c =
        palette[Math.random() < 0.12 ? 3 : Math.floor(Math.random() * 3)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [count]);

  useFrame(({ clock }, delta) => {
    if (!points.current) return;
    points.current.rotation.y += delta * 0.015;
    points.current.position.y = Math.sin(clock.getElapsedTime() * 0.15) * 0.3;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
