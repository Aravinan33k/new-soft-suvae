"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

// Shared background for the Services grid: two stylized angular mech heads
// face off from the left/right edges, an energy core pulses in the gap
// between them, and spark particles burst outward on each pulse. Built from
// primitive geometry (no external 3D assets) — an abstraction of the
// reference "mecha clash" artwork rather than a literal character render,
// which real robot models/rigging would require.

function MechHead({
  side,
  glowColor,
  metalColor,
}: {
  side: "left" | "right";
  glowColor: string;
  metalColor: string;
}) {
  const group = useRef<THREE.Group>(null);
  const visor = useRef<THREE.MeshBasicMaterial>(null);
  const dir = side === "left" ? 1 : -1;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      // Slow bob + a gentle forward/back drift as if squaring up
      group.current.position.x =
        (side === "left" ? -3.2 : 3.2) + Math.sin(t * 0.35) * 0.18 * dir;
      group.current.position.y = Math.sin(t * 0.6 + (side === "left" ? 0 : 2)) * 0.12;
      group.current.rotation.y = (side === "left" ? 0.42 : -0.42) + Math.sin(t * 0.4) * 0.05;
      group.current.rotation.z = Math.sin(t * 0.5) * 0.02;
    }
    if (visor.current) {
      visor.current.color.setScalar(0.85 + Math.sin(t * 3 + (side === "left" ? 0 : 1.5)) * 0.15);
    }
  });

  return (
    <group ref={group} rotation={[0, side === "left" ? 0.4 : -0.4, 0]}>
      {/* Angular head block */}
      <mesh>
        <boxGeometry args={[1.1, 1.3, 1.0]} />
        <meshStandardMaterial color={metalColor} metalness={0.75} roughness={0.32} />
      </mesh>
      {/* Jaw taper */}
      <mesh position={[0, -0.75, 0.05]}>
        <coneGeometry args={[0.62, 0.7, 4]} />
        <meshStandardMaterial color={metalColor} metalness={0.75} roughness={0.32} />
      </mesh>
      {/* Brow ridge */}
      <mesh position={[0, 0.55, 0.42]}>
        <boxGeometry args={[1.15, 0.22, 0.25]} />
        <meshStandardMaterial color={metalColor} metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Horns / fins (differ by side for visual distinction) */}
      {side === "left" ? (
        <>
          <mesh position={[-0.55, 0.9, -0.1]} rotation={[0, 0, 0.4]}>
            <coneGeometry args={[0.14, 0.85, 6]} />
            <meshStandardMaterial color="#7a1f1f" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0.55, 0.9, -0.1]} rotation={[0, 0, -0.4]}>
            <coneGeometry args={[0.14, 0.85, 6]} />
            <meshStandardMaterial color="#7a1f1f" metalness={0.6} roughness={0.4} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[-0.7, 0.35, -0.1]} rotation={[0, 0, 0.9]}>
            <boxGeometry args={[0.14, 0.75, 0.3]} />
            <meshStandardMaterial color="#8a8f99" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0.7, 0.35, -0.1]} rotation={[0, 0, -0.9]}>
            <boxGeometry args={[0.14, 0.75, 0.3]} />
            <meshStandardMaterial color="#8a8f99" metalness={0.85} roughness={0.2} />
          </mesh>
        </>
      )}
      {/* Glowing visor */}
      <mesh position={[0, 0.12, 0.48]}>
        <boxGeometry args={[0.75, 0.16, 0.06]} />
        <meshBasicMaterial ref={visor} color={glowColor} />
      </mesh>
      <pointLight color={glowColor} intensity={6} distance={4} position={[0, 0.12, 0.6]} />
    </group>
  );
}

const sparkVertex = /* glsl */ `
  attribute float aLife;
  attribute float aSize;
  varying float vLife;
  void main() {
    vLife = aLife;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (200.0 / -mv.z) * (1.0 - aLife);
    gl_Position = projectionMatrix * mv;
  }
`;
const sparkFragment = /* glsl */ `
  precision highp float;
  varying float vLife;
  uniform vec3 uColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, soft * (1.0 - vLife));
  }
`;

const SPARKS = 140;

function EnergyClash() {
  const core = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.Mesh>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const sparksGeo = useRef<THREE.BufferGeometry>(null);
  const light = useRef<THREE.PointLight>(null);

  const data = useMemo(() => {
    const positions = new Float32Array(SPARKS * 3);
    const velocities = new Float32Array(SPARKS * 3);
    const life = new Float32Array(SPARKS);
    const size = new Float32Array(SPARKS);
    for (let i = 0; i < SPARKS; i++) {
      life[i] = Math.random();
      size[i] = 1.5 + Math.random() * 2.5;
      const a = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 1.6;
      velocities[i * 3] = Math.cos(a) * speed;
      velocities[i * 3 + 1] = Math.sin(a) * speed * 0.7 + 0.4;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * speed;
    }
    return { positions, velocities, life, size };
  }, []);

  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color("#ffb057") } }), []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    // Pulse: builds and releases every ~2.6s, like an impact building up
    const cycle = (t % 2.6) / 2.6;
    const pulse = Math.pow(Math.max(0, Math.sin(cycle * Math.PI)), 2.2);

    if (core.current) core.current.scale.setScalar(0.55 + pulse * 0.7);
    if (coreMat.current) coreMat.current.opacity = 0.6 + pulse * 0.4;
    if (glow.current) glow.current.scale.setScalar(1.4 + pulse * 2.2);
    if (glowMat.current) glowMat.current.opacity = 0.12 + pulse * 0.28;
    if (light.current) light.current.intensity = 8 + pulse * 26;

    // Sparks: respawn at the core when a pulse peaks, otherwise fly outward
    const { positions, velocities, life, size } = data;
    const justPeaked = cycle > 0.47 && cycle < 0.53;
    for (let i = 0; i < SPARKS; i++) {
      life[i] += delta * 0.55;
      if (life[i] > 1) {
        if (justPeaked && Math.random() < 0.5) {
          life[i] = 0;
          positions[i * 3] = 0;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = 0;
        } else {
          life[i] = 1; // stay dormant/invisible until the next peak
          continue;
        }
      }
      positions[i * 3] += velocities[i * 3] * delta;
      positions[i * 3 + 1] += (velocities[i * 3 + 1] - 1.1 * life[i]) * delta;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;
    }
    if (sparksGeo.current) {
      sparksGeo.current.attributes.position.needsUpdate = true;
      sparksGeo.current.attributes.aLife.needsUpdate = true;
    }
  });

  return (
    <group>
      <mesh ref={core}>
        <sphereGeometry args={[0.26, 20, 20]} />
        <meshBasicMaterial ref={coreMat} color="#fff2c9" transparent />
      </mesh>
      <mesh ref={glow}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial
          ref={glowMat}
          color="#ff8a3d"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight ref={light} color="#ffb057" intensity={10} distance={7} />
      <points>
        <bufferGeometry ref={sparksGeo}>
          <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
          <bufferAttribute attach="attributes-aLife" args={[data.life, 1]} />
          <bufferAttribute attach="attributes-aSize" args={[data.size, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={sparkVertex}
          fragmentShader={sparkFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <MechHead side="left" glowColor="#ff6a3d" metalColor="#1c1c1f" />
      <MechHead side="right" glowColor="#c084fc" metalColor="#9aa0ab" />
      <EnergyClash />
    </>
  );
}

export default function MechaClashScene() {
  return (
    <Canvas
      camera={{ fov: 38, near: 0.1, far: 40, position: [0, 0.3, 8] }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      style={{ background: "transparent" }}
    >
      <Scene />
    </Canvas>
  );
}
