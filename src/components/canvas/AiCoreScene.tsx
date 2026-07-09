"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, Sparkles, MeshDistortMaterial } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// A real WebGL 3D "AI core" — a living, distorting emissive icosahedron inside
// a wireframe shell, wrapped by orbiting glowing nodes wired back to the core,
// with a drifting spark field. Real bloom post-processing gives it the glow a
// 2D canvas can't fake. Emissive materials use toneMapped={false} so they blow
// past 1.0 luminance and the Bloom pass catches them hard.
const ORANGE = "#FF8A3D";
const BLUE = "#4EA8FF";

function Core({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current && !reduced) ref.current.rotation.y += dt * 0.2;
  });
  return (
    <Float
      speed={reduced ? 0 : 1.4}
      rotationIntensity={reduced ? 0 : 0.4}
      floatIntensity={reduced ? 0 : 0.6}
    >
      {/* the breathing, distorting core */}
      <mesh ref={ref}>
        <icosahedronGeometry args={[1.3, 6]} />
        <MeshDistortMaterial
          color={ORANGE}
          emissive={ORANGE}
          emissiveIntensity={1.7}
          distort={reduced ? 0.15 : 0.38}
          speed={reduced ? 0 : 2.2}
          roughness={0.25}
          metalness={0.1}
          toneMapped={false}
        />
      </mesh>
      {/* faint wireframe shell around it */}
      <mesh scale={1.4}>
        <icosahedronGeometry args={[1.3, 2]} />
        <meshBasicMaterial color={ORANGE} wireframe transparent opacity={0.14} toneMapped={false} />
      </mesh>
    </Float>
  );
}

function OrbitingNodes({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const nodes = useMemo(() => {
    const count = 7;
    const r = 2.7;
    return Array.from({ length: count }, (_, i) => {
      // even distribution on a sphere (fibonacci)
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      );
    });
  }, []);

  useFrame((_, dt) => {
    if (group.current && !reduced) {
      group.current.rotation.y += dt * 0.16;
      group.current.rotation.x += dt * 0.05;
    }
  });

  return (
    <group ref={group}>
      {nodes.map((p, i) => {
        const col = i % 2 ? BLUE : ORANGE;
        return (
          <group key={i}>
            <Line
              points={[[0, 0, 0], [p.x, p.y, p.z]]}
              color={col}
              lineWidth={0.7}
              transparent
              opacity={0.35}
            />
            <mesh position={p}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial
                color={col}
                emissive={col}
                emissiveIntensity={3}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function AiCoreScene({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.8]}
        frameloop={reduced ? "demand" : "always"}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={45} color={ORANGE} />
        <pointLight position={[-5, -3, -4]} intensity={28} color={BLUE} />
        <Core reduced={reduced} />
        <OrbitingNodes reduced={reduced} />
        <Sparkles
          count={90}
          scale={9}
          size={2}
          speed={reduced ? 0 : 0.4}
          color={ORANGE}
          opacity={0.6}
        />
        <EffectComposer>
          <Bloom
            mipmapBlur
            intensity={1.25}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.3}
            radius={0.72}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
