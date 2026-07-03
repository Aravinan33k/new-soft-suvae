"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

// 3D neural brain for the hero: a wrinkled point-cloud brain with nearest-
// neighbour network links, warm "thought" hotspots, and a constellation of
// dots floating around it — recreating the reference artwork. It idles in a
// slow spin and the page scroll drives a full 360° rotation on top.

function Brain() {
  const group = useRef<THREE.Group>(null);
  const blinkA = useRef<THREE.PointsMaterial>(null);
  const blinkB = useRef<THREE.PointsMaterial>(null);

  const data = useMemo(() => {
    const N = 2600;
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const base = [
      new THREE.Color("#2f7bff"),
      new THREE.Color("#3ec9ff"),
      new THREE.Color("#8fb7ff"),
    ];
    const hot = [new THREE.Color("#ffb057"), new THREE.Color("#ff5fd0")];
    const pts: THREE.Vector3[] = [];

    for (let i = 0; i < N; i++) {
      const u = Math.random() * 2 - 1;
      const phi = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      let x = s * Math.cos(phi);
      let y = u;
      let z = s * Math.sin(phi);
      // Cortical wrinkles
      const wr =
        1 +
        0.07 * Math.sin(x * 9 + z * 7) * Math.sin(y * 8) +
        0.05 * Math.sin(z * 12 + x * 4);
      x *= 1.0 * wr;
      y *= 0.82 * wr;
      z *= 1.28 * wr;
      x += Math.sign(x) * 0.05; // longitudinal fissure
      pts.push(new THREE.Vector3(x, y, z));
      positions.set([x, y, z], i * 3);

      // Warm hotspots clustered top-front, a few scattered elsewhere
      const hotspot =
        (y > 0.25 && z > 0.25 && Math.random() < 0.3) || Math.random() < 0.015;
      const c = hotspot
        ? hot[Math.floor(Math.random() * hot.length)]
        : base[Math.floor(Math.random() * base.length)];
      colors.set([c.r, c.g, c.b], i * 3);
    }

    // Network links between nearest neighbours (on a subset for cost)
    const subset = pts.filter((_, i) => i % 4 === 0);
    const E: number[] = [];
    for (let i = 0; i < subset.length; i++) {
      let best = -1;
      let bd = Infinity;
      for (let j = 0; j < subset.length; j++) {
        if (i === j) continue;
        const d = subset[i].distanceToSquared(subset[j]);
        if (d < bd) {
          bd = d;
          best = j;
        }
      }
      if (best >= 0 && bd < 0.09) {
        E.push(
          subset[i].x, subset[i].y, subset[i].z,
          subset[best].x, subset[best].y, subset[best].z,
        );
      }
    }

    // Constellation floating around the brain
    const H = 170;
    const halo = new Float32Array(H * 3);
    const haloPts: THREE.Vector3[] = [];
    for (let i = 0; i < H; i++) {
      const u2 = Math.random() * 2 - 1;
      const phi2 = Math.random() * Math.PI * 2;
      const s2 = Math.sqrt(1 - u2 * u2);
      const r = 1.6 + Math.random() * 1.4;
      const v = new THREE.Vector3(
        s2 * Math.cos(phi2) * r,
        u2 * r * 0.8,
        s2 * Math.sin(phi2) * r,
      );
      haloPts.push(v);
      halo.set([v.x, v.y, v.z], i * 3);
    }
    // Sparse constellation lines
    const HE: number[] = [];
    for (let i = 0; i < H; i++) {
      if (Math.random() > 0.3) continue;
      let best = -1;
      let bd = Infinity;
      for (let j = 0; j < H; j++) {
        if (i === j) continue;
        const d = haloPts[i].distanceToSquared(haloPts[j]);
        if (d < bd) {
          bd = d;
          best = j;
        }
      }
      if (best >= 0 && bd < 1.2) {
        HE.push(
          haloPts[i].x, haloPts[i].y, haloPts[i].z,
          haloPts[best].x, haloPts[best].y, haloPts[best].z,
        );
      }
    }

    // Blinking sparkle subsets
    const sparkA = new Float32Array(
      pts.filter((_, i) => i % 17 === 0).flatMap((p) => [p.x, p.y, p.z]),
    );
    const sparkB = new Float32Array(
      pts.filter((_, i) => i % 23 === 5).flatMap((p) => [p.x, p.y, p.z]),
    );

    return {
      positions,
      colors,
      edges: new Float32Array(E),
      halo,
      haloEdges: new Float32Array(HE),
      sparkA,
      sparkB,
    };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const scroll = typeof window !== "undefined" ? window.scrollY : 0;
    if (group.current) {
      // Idle spin + full 360° driven by page scroll
      group.current.rotation.y = t * 0.12 + scroll * 0.0035;
      group.current.rotation.x = -0.12 + Math.sin(t * 0.3) * 0.05;
      const breathe = 1 + Math.sin(t * 0.8) * 0.012;
      group.current.scale.setScalar(breathe);
    }
    if (blinkA.current)
      blinkA.current.opacity = 0.35 + 0.6 * Math.abs(Math.sin(t * 1.6));
    if (blinkB.current)
      blinkB.current.opacity = 0.35 + 0.6 * Math.abs(Math.sin(t * 2.1 + 1.5));
  });

  return (
    <group ref={group}>
      {/* Brain point cloud */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.022}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </points>

      {/* Neural links */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.edges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#4d86ff"
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </lineSegments>

      {/* Blinking sparkles */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.sparkA, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={blinkA}
          size={0.05}
          sizeAttenuation
          color="#bfe3ff"
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.sparkB, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={blinkB}
          size={0.045}
          sizeAttenuation
          color="#ffd9a3"
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </points>

      {/* Constellation around the brain */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.halo, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          sizeAttenuation
          color="#6fa0e8"
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.haloEdges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#7aa4e0"
          transparent
          opacity={0.16}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

export default function BrainScene() {
  return (
    <Canvas
      camera={{ fov: 45, near: 0.1, far: 50, position: [0, 0, 3.6] }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Brain />
    </Canvas>
  );
}
