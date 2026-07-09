"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, Sparkles, MeshDistortMaterial } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// A real WebGL 3D "living infrastructure" — a glowing cloud sync-core wrapped
// by two rings of emissive server nodes, wired together with light beams, with
// data packets streaming along every link. Real bloom gives the fibre-optic
// glow. The whole network breathes and slowly rotates so it feels alive.
const ORANGE = "#FF8A3D";
const BLUE = "#4EA8FF";
const GOLD = "#FFC76A";

type Edge = { a: THREE.Vector3; b: THREE.Vector3 };

function useNetwork() {
  return useMemo(() => {
    const nodes: THREE.Vector3[] = [];
    // ring 1 (upper), ring 2 (lower) — a little 3D city of servers
    const ring = (count: number, r: number, y: number, off: number) => {
      for (let i = 0; i < count; i++) {
        const a = off + (i / count) * Math.PI * 2;
        nodes.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
      }
    };
    ring(6, 2.5, 0.7, 0);
    ring(5, 3.3, -0.8, 0.4);

    const core = new THREE.Vector3(0, 0, 0);
    const edges: Edge[] = [];
    // every node wired back to the core (the sync hub)
    nodes.forEach((n) => edges.push({ a: core, b: n }));
    // ring-1 neighbours (0..5) and ring-2 neighbours (6..10) wired around
    const link = (s: number, e: number) => {
      for (let i = s; i < e; i++) {
        const j = i + 1 > e - 1 ? s : i + 1;
        edges.push({ a: nodes[i], b: nodes[j] });
      }
    };
    link(0, 6);
    link(6, 11);
    return { nodes, edges };
  }, []);
}

function Packets({ edges, reduced }: { edges: Edge[]; reduced: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const COUNT = 26;
  // each packet rides one edge at its own speed/offset
  const packets = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        e: i % edges.length,
        speed: 0.18 + (i % 5) * 0.06,
        offset: (i * 0.137) % 1,
      })),
    [edges.length],
  );

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = reduced ? 0.15 : state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const p = packets[i];
      const edge = edges[p.e];
      const frac = (p.offset + t * p.speed) % 1;
      dummy.position.copy(edge.a).lerp(edge.b, frac);
      const s = 0.9 + 0.3 * Math.sin(frac * Math.PI); // fade in/out along the run
      dummy.scale.setScalar(0.07 * s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={4} toneMapped={false} />
    </instancedMesh>
  );
}

function Node({ position, color }: { position: THREE.Vector3; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    // subtle breathing so the servers feel powered, never static
    const b = 1 + 0.06 * Math.sin(state.clock.elapsedTime * 1.5 + position.x + position.z);
    ref.current.scale.setScalar(b);
  });
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[0.34, 0.5, 0.34]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} toneMapped={false} />
    </mesh>
  );
}

function Network({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { nodes, edges } = useNetwork();
  useFrame((_, dt) => {
    if (group.current && !reduced) group.current.rotation.y += dt * 0.12;
  });
  return (
    <group ref={group}>
      {/* light-beam links */}
      {edges.map((e, i) => (
        <Line
          key={i}
          points={[e.a.toArray(), e.b.toArray()]}
          color={i % 3 === 0 ? BLUE : ORANGE}
          lineWidth={0.6}
          transparent
          opacity={0.22}
        />
      ))}
      {/* server nodes */}
      {nodes.map((n, i) => (
        <Node key={i} position={n} color={i % 3 === 0 ? BLUE : ORANGE} />
      ))}
      {/* central cloud sync-core — smaller & dimmer so bloom doesn't blow it
          out into a flat disc; a wireframe shell keeps its 3D shape readable */}
      <Float speed={reduced ? 0 : 1.2} rotationIntensity={reduced ? 0 : 0.3} floatIntensity={reduced ? 0 : 0.4}>
        <mesh>
          <icosahedronGeometry args={[0.68, 5]} />
          <MeshDistortMaterial
            color={ORANGE}
            emissive={ORANGE}
            emissiveIntensity={0.85}
            distort={reduced ? 0.1 : 0.3}
            speed={reduced ? 0 : 2}
            roughness={0.3}
            metalness={0.1}
            toneMapped={false}
          />
        </mesh>
        <mesh scale={1.35}>
          <icosahedronGeometry args={[0.68, 2]} />
          <meshBasicMaterial color={ORANGE} wireframe transparent opacity={0.25} toneMapped={false} />
        </mesh>
      </Float>
      <Packets edges={edges} reduced={reduced} />
    </group>
  );
}

export default function CloudNetworkScene({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 1.4, 7.5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.8]}
        frameloop={reduced ? "demand" : "always"}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={45} color={ORANGE} />
        <pointLight position={[-5, -2, -4]} intensity={28} color={BLUE} />
        <Network reduced={reduced} />
        <Sparkles count={70} scale={11} size={2} speed={reduced ? 0 : 0.35} color={BLUE} opacity={0.5} />
        <EffectComposer>
          <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.35} luminanceSmoothing={0.25} radius={0.6} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
