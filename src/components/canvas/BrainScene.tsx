"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

// 3D neural brain for the hero. Design goals (per feedback):
//  1. Depth: points carry a continuous front<->back depth value that drives
//     size, sharpness and brightness — front reads crisp and bright, back
//     reads soft and dim (a cheap, robust stand-in for real depth-of-field
//     that avoids the depth-buffer conflicts real DoF has with additive,
//     depth-write-disabled particles).
//  2. Node variety: every point is tagged large/medium/small (10/30/60%).
//  3. Smarter connections: a distance-capped Minimum Spanning Forest (via
//     Kruskal + union-find) instead of per-point nearest-neighbour — this
//     produces branching, non-crossing clusters rather than a dense web,
//     plus a handful of explicit long-range links between clusters.
//  4. Data flow: pulses ride the skeleton edges, 2-3s per traversal,
//     randomized direction/phase, three warm colors.
//  5. Processing hotspots: a few fixed regions (front/center/back) breathe
//     with independent random-period glow cycles.

const isMobileDevice = () =>
  typeof window !== "undefined" && window.innerWidth < 768;

// ---------------------------------------------------------------------
// Union-find, used to grow a distance-capped minimum spanning forest so
// the skeleton branches like real neural pathways instead of a random web.
class DSU {
  parent: Int32Array;
  constructor(n: number) {
    this.parent = new Int32Array(n);
    for (let i = 0; i < n; i++) this.parent[i] = i;
  }
  find(x: number): number {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }
  union(a: number, b: number): boolean {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    this.parent[ra] = rb;
    return true;
  }
}

function buildSkeleton(pts: THREE.Vector3[], maxLinkDist: number, edgeBudgetRatio: number) {
  const M = pts.length;
  const maxD2 = maxLinkDist * maxLinkDist;
  const candidates: [number, number, number][] = [];
  for (let i = 0; i < M; i++) {
    for (let j = i + 1; j < M; j++) {
      const d2 = pts[i].distanceToSquared(pts[j]);
      if (d2 < maxD2) candidates.push([d2, i, j]);
    }
  }
  candidates.sort((a, b) => a[0] - b[0]);

  const dsu = new DSU(M);
  const budget = Math.floor(M * edgeBudgetRatio);
  const edges: number[] = [];
  for (const [, i, j] of candidates) {
    if (edges.length / 2 >= budget) break;
    if (dsu.union(i, j)) edges.push(i, j);
  }

  // A handful of rare long-range links between distant clusters
  let tries = 0;
  let added = 0;
  while (added < 9 && tries < 600) {
    tries++;
    const i = Math.floor(Math.random() * M);
    const j = Math.floor(Math.random() * M);
    if (i === j) continue;
    if (pts[i].distanceTo(pts[j]) < maxLinkDist * 2.1) continue;
    edges.push(i, j);
    added++;
  }

  return edges;
}

// ---------------------------------------------------------------------
// Dust cloud (the brain's cortical surface): depth-tiered size/sharpness,
// size-tiered large/medium/small nodes, warm vertex colors.
const dustVertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSizeMul;
  attribute float aDepth; // 0 = far/back, 1 = near/front
  varying vec3 vColor;
  varying float vDepth;
  varying float vSharp;

  void main() {
    vColor = aColor;
    vDepth = aDepth;
    // Only the large hub tier is allowed to render fully sharp — a crisp
    // circular cutoff can't resolve cleanly on small/medium points, so they
    // always stay soft regardless of depth (avoids square-pixel artifacts).
    vSharp = vDepth * smoothstep(1.0, 1.9, aSizeMul);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Back points render larger — combined with a wide soft falloff in the
    // fragment shader this reads as blur without a real depth-of-field pass.
    float depthSize = mix(1.5, 1.0, aDepth);
    gl_PointSize = clamp(aSizeMul * depthSize * (9.0 / -mv.z), 1.4, 11.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const dustFragment = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vDepth;
  varying float vSharp;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    // Sharp hubs: tight core. Small/back dust: wide soft haze.
    float edge = mix(0.5, 0.22, vSharp);
    float soft = smoothstep(0.5, 0.5 - edge, d);
    float opacity = soft * mix(0.32, 1.0, vDepth);
    if (opacity < 0.01) discard;
    gl_FragColor = vec4(vColor, opacity);
  }
`;

// Glowing skeleton nodes / pulses share this shader (proven pattern)
const glowVertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aBright;
  attribute float aSize;
  varying vec3 vColor;
  varying float vBright;
  void main() {
    vColor = aColor;
    vBright = aBright;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * (260.0 / -mv.z), 1.0, 22.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const glowFragment = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vBright;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.18, 0.0, d);
    float intensity = (soft * 0.6 + core * 0.9) * vBright;
    gl_FragColor = vec4(vColor * intensity, 1.0);
  }
`;

const PULSE_COLORS = ["#ff6a3d", "#ffffff", "#ffd37a"];

// Fixed anatomical regions that breathe independently — front cortex,
// center, and back, per the brief.
const HOTSPOTS: [number, number, number][] = [
  [0.05, 0.4, 1.05],
  [0.3, -0.05, 0.15],
  [-0.35, 0.15, -1.05],
  [0.65, -0.2, -0.35],
];

function Brain() {
  const group = useRef<THREE.Group>(null);
  const blinkA = useRef<THREE.PointsMaterial>(null);
  const blinkB = useRef<THREE.PointsMaterial>(null);
  const pulsesGeo = useRef<THREE.BufferGeometry>(null);
  const hotspotGeo = useRef<THREE.BufferGeometry>(null);

  const mobile = isMobileDevice();
  const N = mobile ? 1600 : 2600;
  const PULSES = mobile ? 46 : 90;

  const data = useMemo(() => {
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const sizeMul = new Float32Array(N);
    const depth = new Float32Array(N);

    const base = [
      new THREE.Color("#ff8a3d"),
      new THREE.Color("#ffb057"),
      new THREE.Color("#f9723c"),
    ];
    const hot = [new THREE.Color("#ffe0a3"), new THREE.Color("#ff5f4d")];
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
      const p = new THREE.Vector3(x, y, z);
      pts.push(p);
      positions.set([x, y, z], i * 3);

      // Depth: camera sits at +z looking toward the origin, so larger z
      // is nearer the camera ("front"). Normalize local z to 0..1.
      depth[i] = THREE.MathUtils.clamp((z + 1.6) / 3.2, 0, 1);

      // Node variety: 60% small signal dust, 30% medium, 10% large hubs
      const r = Math.random();
      sizeMul[i] =
        r < 0.6
          ? 0.5 + Math.random() * 0.25
          : r < 0.9
            ? 1.0 + Math.random() * 0.4
            : 1.85 + Math.random() * 0.95;

      // Warm hotspots clustered top-front, a few scattered elsewhere
      const hotspot =
        (y > 0.25 && z > 0.25 && Math.random() < 0.3) || Math.random() < 0.015;
      const c = hotspot
        ? hot[Math.floor(Math.random() * hot.length)]
        : base[Math.floor(Math.random() * base.length)];
      colors.set([c.r, c.g, c.b], i * 3);
    }

    // Skeleton: distance-capped minimum spanning forest, so links branch
    // in clusters rather than crossing randomly — plus a few long-range
    // links between distant clusters.
    const skeletonPts = pts.filter((_, i) => i % 4 === 0);
    const skeletonEdges = buildSkeleton(skeletonPts, 0.62, 0.86);
    const edgeCount = skeletonEdges.length / 2;

    const linePositions = new Float32Array(edgeCount * 2 * 3);
    for (let e = 0; e < edgeCount; e++) {
      const a = skeletonPts[skeletonEdges[e * 2]];
      const b = skeletonPts[skeletonEdges[e * 2 + 1]];
      const o = e * 6;
      linePositions.set([a.x, a.y, a.z, b.x, b.y, b.z], o);
    }

    // Pulses: each rides one skeleton edge, random direction/phase, one of
    // three warm colors, 2-3s per traversal.
    const pulseA = new Float32Array(PULSES * 3);
    const pulseB = new Float32Array(PULSES * 3);
    const pulsePhase = new Float32Array(PULSES);
    const pulseSpeed = new Float32Array(PULSES);
    const pulseColor = new Float32Array(PULSES * 3);
    const pulseSize = new Float32Array(PULSES).fill(2.6);
    const tmpColor = new THREE.Color();
    for (let p = 0; p < PULSES; p++) {
      const e = Math.floor(Math.random() * edgeCount);
      let a = skeletonPts[skeletonEdges[e * 2]];
      let b = skeletonPts[skeletonEdges[e * 2 + 1]];
      if (Math.random() < 0.5) [a, b] = [b, a]; // randomize travel direction
      pulseA.set([a.x, a.y, a.z], p * 3);
      pulseB.set([b.x, b.y, b.z], p * 3);
      pulsePhase[p] = Math.random();
      pulseSpeed[p] = 1 / (2 + Math.random()); // 2-3s per traversal
      tmpColor.set(PULSE_COLORS[Math.floor(Math.random() * PULSE_COLORS.length)]);
      pulseColor.set([tmpColor.r, tmpColor.g, tmpColor.b], p * 3);
    }

    // Blinking sparkle subsets
    const sparkA = new Float32Array(
      pts.filter((_, i) => i % 17 === 0).flatMap((p) => [p.x, p.y, p.z]),
    );
    const sparkB = new Float32Array(
      pts.filter((_, i) => i % 23 === 5).flatMap((p) => [p.x, p.y, p.z]),
    );

    // Hotspots: fixed regions, independent breathing period/phase
    const hotspotPos = new Float32Array(HOTSPOTS.length * 3);
    const hotspotPeriod = new Float32Array(HOTSPOTS.length);
    const hotspotOffset = new Float32Array(HOTSPOTS.length);
    const hotspotSize = new Float32Array(HOTSPOTS.length);
    HOTSPOTS.forEach(([x, y, z], i) => {
      hotspotPos.set([x, y, z], i * 3);
      hotspotPeriod[i] = 3 + Math.random() * 3.2;
      hotspotOffset[i] = Math.random() * 10;
      hotspotSize[i] = 60 + Math.random() * 26;
    });

    return {
      positions,
      colors,
      sizeMul,
      depth,
      linePositions,
      pulseA,
      pulseB,
      pulsePhase,
      pulseSpeed,
      pulseColor,
      pulseSize,
      sparkA,
      sparkB,
      hotspotPos,
      hotspotPeriod,
      hotspotOffset,
      hotspotSize,
    };
  }, [N, PULSES]);

  const pulsePosBuf = useMemo(() => new Float32Array(PULSES * 3), [PULSES]);
  const pulseBrightBuf = useMemo(() => new Float32Array(PULSES), [PULSES]);
  const hotspotBrightBuf = useMemo(
    () => new Float32Array(HOTSPOTS.length),
    [],
  );
  const hotspotSizeBuf = useMemo(
    () => new Float32Array(data.hotspotSize),
    [data.hotspotSize],
  );

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

    // Data pulses traveling along the skeleton
    const { pulseA, pulseB, pulsePhase, pulseSpeed } = data;
    for (let p = 0; p < PULSES; p++) {
      const prog = (t * pulseSpeed[p] + pulsePhase[p]) % 1;
      const p3 = p * 3;
      pulsePosBuf[p3] = pulseA[p3] + (pulseB[p3] - pulseA[p3]) * prog;
      pulsePosBuf[p3 + 1] =
        pulseA[p3 + 1] + (pulseB[p3 + 1] - pulseA[p3 + 1]) * prog;
      pulsePosBuf[p3 + 2] =
        pulseA[p3 + 2] + (pulseB[p3 + 2] - pulseA[p3 + 2]) * prog;
      pulseBrightBuf[p] = Math.sin(prog * Math.PI); // fade in/out at ends
    }
    if (pulsesGeo.current) {
      pulsesGeo.current.attributes.position.needsUpdate = true;
      pulsesGeo.current.attributes.aBright.needsUpdate = true;
    }

    // Processing hotspots: expand-and-fade on independent random periods
    for (let h = 0; h < HOTSPOTS.length; h++) {
      const cycle = ((t + data.hotspotOffset[h]) / data.hotspotPeriod[h]) % 1;
      const env = Math.pow(Math.max(0, Math.sin(cycle * Math.PI)), 1.6);
      hotspotBrightBuf[h] = env * 0.85;
      hotspotSizeBuf[h] = data.hotspotSize[h] * (0.75 + 0.5 * env);
    }
    if (hotspotGeo.current) {
      hotspotGeo.current.attributes.aBright.needsUpdate = true;
      hotspotGeo.current.attributes.aSize.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      {/* Cortical dust cloud: depth-tiered sharpness, size-tiered nodes
          (positions never change post-mount, so this geometry is static) */}
      <points renderOrder={1} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[data.colors, 3]} />
          <bufferAttribute attach="attributes-aSizeMul" args={[data.sizeMul, 1]} />
          <bufferAttribute attach="attributes-aDepth" args={[data.depth, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={dustVertex}
          fragmentShader={dustFragment}
          transparent
          depthWrite={false}
        />
      </points>

      {/* Skeleton: branching clustered connections (MST + rare long-range) */}
      <lineSegments renderOrder={2} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#ff8a3d"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </lineSegments>

      {/* Data flow pulses */}
      <points renderOrder={3} frustumCulled={false}>
        <bufferGeometry ref={pulsesGeo}>
          <bufferAttribute attach="attributes-position" args={[pulsePosBuf, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[data.pulseColor, 3]} />
          <bufferAttribute attach="attributes-aBright" args={[pulseBrightBuf, 1]} />
          <bufferAttribute attach="attributes-aSize" args={[data.pulseSize, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={glowVertex}
          fragmentShader={glowFragment}
          transparent
          depthTest={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Processing hotspots: front cortex / center / back, breathing */}
      <points renderOrder={4} frustumCulled={false}>
        <bufferGeometry ref={hotspotGeo}>
          <bufferAttribute attach="attributes-position" args={[data.hotspotPos, 3]} />
          <bufferAttribute attach="attributes-aBright" args={[hotspotBrightBuf, 1]} />
          <bufferAttribute attach="attributes-aSize" args={[hotspotSizeBuf, 1]} />
        </bufferGeometry>
        <HotspotMaterial />
      </points>

      {/* Blinking sparkles */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.sparkA, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={blinkA}
          size={0.05}
          sizeAttenuation
          color="#ffe0a3"
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
          color="#ff6a3d"
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// Registered as a tag above to keep the hotspot points block declarative;
// implemented as a plain shaderMaterial with a warm, wide, soft falloff
// (bigger and hazier than the pulse glow — a breathing cloud, not a dot).
const hotspotVertex = /* glsl */ `
  attribute float aBright;
  attribute float aSize;
  varying float vBright;
  void main() {
    vBright = aBright;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * (60.0 / -mv.z), 1.0, 140.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const hotspotFragment = /* glsl */ `
  precision highp float;
  varying float vBright;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);
    vec3 warm = mix(vec3(1.0, 0.42, 0.24), vec3(1.0, 0.82, 0.55), soft);
    gl_FragColor = vec4(warm, soft * soft * vBright);
  }
`;

function HotspotMaterial() {
  return (
    <shaderMaterial
      vertexShader={hotspotVertex}
      fragmentShader={hotspotFragment}
      transparent
      depthTest={false}
      depthWrite={false}
      blending={THREE.AdditiveBlending}
    />
  );
}

export default function BrainScene() {
  return (
    <Canvas
      camera={{ fov: 45, near: 0.1, far: 50, position: [0, 0, 3.6] }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Brain />
    </Canvas>
  );
}
