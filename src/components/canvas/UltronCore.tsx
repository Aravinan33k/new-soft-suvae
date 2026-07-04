"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

// 3D "Ultron AI Core" for the hero — a self-contained spherical energy
// core rebuilt from the reference art. Layered structure, all glowing
// gold/orange on transparent bg, spinning 360°:
//   - Central singularity: a bright pulsing core + soft bloom, with a
//     radial burst of spokes shooting to the shell (visible from any angle).
//   - Wireframe globe grid: meridians (pole-to-pole great circles) +
//     latitude rings — the concentric "processing rings" seen edge-on.
//   - Vein lattice: a multi-shell cloud of nodes wired to nearby neighbours
//     by a proximity graph -> the crisscrossing "connection veins", with
//     glowing nodes at the junctions ("quantum data lattice").
//   - Data pulses ride the veins (energy/data flow), warm colors, ~2-3s.
//   - A few embedded rectangular panels floating in the lattice.
//   - A glowing projector base underneath (concentric rings + bloom) that
//     counter-rotates slowly, so the core reads as a hologram.

const isMobileDevice = () =>
  typeof window !== "undefined" && window.innerWidth < 768;

const R = 1.35; // core radius

// ---------------------------------------------------------------------
// Even direction sampling on a sphere (Fibonacci lattice).
function fibDir(i: number, n: number): [number, number, number] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (i / (n - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const th = golden * i;
  return [Math.cos(th) * r, y, Math.sin(th) * r];
}

// Proximity graph: link each point to its nearest neighbours within
// maxDist (keeps cycles -> crisscrossing web, not a spanning tree).
function buildVeins(pts: THREE.Vector3[], maxDist: number, maxPerPoint: number) {
  const M = pts.length;
  const maxD2 = maxDist * maxDist;
  const seen = new Set<number>();
  const edges: number[] = [];
  const buf: { j: number; d2: number }[] = [];
  for (let i = 0; i < M; i++) {
    buf.length = 0;
    for (let j = 0; j < M; j++) {
      if (i === j) continue;
      const d2 = pts[i].distanceToSquared(pts[j]);
      if (d2 < maxD2) buf.push({ j, d2 });
    }
    buf.sort((a, b) => a.d2 - b.d2);
    const take = Math.min(maxPerPoint, buf.length);
    for (let k = 0; k < take; k++) {
      const j = buf[k].j;
      const key = i < j ? i * M + j : j * M + i;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push(i, j);
    }
  }
  return edges;
}

// Append the segments of one ring (in the plane spanned by U, V about
// center) to a flat number[] as line-segment pairs.
function pushRing(
  out: number[],
  radius: number,
  U: THREE.Vector3,
  V: THREE.Vector3,
  center: THREE.Vector3,
  segs: number,
) {
  let px = 0;
  let py = 0;
  let pz = 0;
  for (let i = 0; i <= segs; i++) {
    const th = (i / segs) * Math.PI * 2;
    const co = Math.cos(th) * radius;
    const si = Math.sin(th) * radius;
    const x = center.x + U.x * co + V.x * si;
    const y = center.y + U.y * co + V.y * si;
    const z = center.z + U.z * co + V.z * si;
    if (i > 0) out.push(px, py, pz, x, y, z);
    px = x;
    py = y;
    pz = z;
  }
}

// ---------------------------------------------------------------------
// Glow shader shared by nodes + pulses: additive, soft halo + tight core.
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
    gl_PointSize = clamp(aSize * (42.0 / -mv.z), 1.0, 12.0);
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
    float core = smoothstep(0.2, 0.0, d);
    gl_FragColor = vec4(vColor * (soft * 0.6 + core) * vBright, 1.0);
  }
`;

// Big soft bloom (singularity + base center); intensity driven per frame.
const bloomVertex = /* glsl */ `
  attribute float aSize;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * (300.0 / -mv.z), 2.0, 340.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const bloomFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uIntensity;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.12, 0.0, d);
    gl_FragColor = vec4(uColor, (soft * soft * 0.7 + core) * uIntensity);
  }
`;

const PULSE_COLORS = ["#ffd37a", "#ffffff", "#ff8a3d"];

function Core() {
  const spin = useRef<THREE.Group>(null);
  const baseSpin = useRef<THREE.Group>(null);
  const coreMesh = useRef<THREE.Mesh>(null);
  const pulsesGeo = useRef<THREE.BufferGeometry>(null);

  const mobile = isMobileDevice();
  const N = mobile ? 360 : 640; // lattice nodes
  const PULSES = mobile ? 44 : 90;
  const MERIDIANS = mobile ? 6 : 9;
  const LATITUDES = mobile ? 5 : 7;

  // Materials with live uniforms (mutated in useFrame)
  const singularityMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: bloomVertex,
        fragmentShader: bloomFragment,
        uniforms: {
          uColor: { value: new THREE.Color("#fff0c0") },
          uIntensity: { value: 1 },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const baseMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: bloomVertex,
        fragmentShader: bloomFragment,
        uniforms: {
          uColor: { value: new THREE.Color("#ffb04a") },
          uIntensity: { value: 1 },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const data = useMemo(() => {
    const inner = new THREE.Color("#fff1c4");
    const outer = new THREE.Color("#ff6a1f");
    const tmp = new THREE.Color();

    // --- Vein lattice: multi-shell node cloud -------------------------
    const pts: THREE.Vector3[] = [];
    const nodeColor = new Float32Array(N * 3);
    const nodeSize = new Float32Array(N);
    const nodeBright = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const [dx, dy, dz] = fibDir(i, N);
      // Shell tiers: mostly outer shell, some mid, a few inner
      const r = Math.random();
      const shell = r < 0.6 ? 1.0 : r < 0.85 ? 0.72 : 0.46;
      const rad = R * shell + (Math.random() - 0.5) * 0.05;
      const p = new THREE.Vector3(dx * rad, dy * rad, dz * rad);
      pts.push(p);

      const tt = THREE.MathUtils.smoothstep(rad / R, 0.4, 1.0);
      tmp.copy(inner).lerp(outer, tt);
      nodeColor.set([tmp.r, tmp.g, tmp.b], i * 3);
      // Size tiers: dust / node / hub
      const s = Math.random();
      nodeSize[i] = s < 0.6 ? 0.16 : s < 0.9 ? 0.34 : 0.62;
      nodeBright[i] = 0.55 + Math.random() * 0.6;
    }

    const edges = buildVeins(pts, R * 0.34, 4);
    const edgeCount = edges.length / 2;
    const veinPos = new Float32Array(edgeCount * 6);
    for (let e = 0; e < edgeCount; e++) {
      const a = pts[edges[e * 2]];
      const b = pts[edges[e * 2 + 1]];
      veinPos.set([a.x, a.y, a.z, b.x, b.y, b.z], e * 6);
    }
    const nodePos = new Float32Array(N * 3);
    pts.forEach((p, i) => nodePos.set([p.x, p.y, p.z], i * 3));

    // --- Wireframe globe grid: meridians + latitudes ------------------
    const grid: number[] = [];
    const yAxis = new THREE.Vector3(0, 1, 0);
    for (let m = 0; m < MERIDIANS; m++) {
      const phi = (m / MERIDIANS) * Math.PI; // 0..180, other half mirrors
      const U = new THREE.Vector3(Math.cos(phi), 0, Math.sin(phi));
      pushRing(grid, R, U, yAxis, new THREE.Vector3(), 128);
    }
    for (let l = 1; l <= LATITUDES; l++) {
      const y = R * (-1 + (2 * l) / (LATITUDES + 1));
      const rr = Math.sqrt(Math.max(0, R * R - y * y));
      pushRing(
        grid,
        rr,
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, y, 0),
        96,
      );
    }
    const gridPos = new Float32Array(grid);

    // --- Radial burst spokes from the singularity ---------------------
    const SP = mobile ? 18 : 30;
    const spokePos: number[] = [];
    const spokeCol: number[] = [];
    const pushSpoke = (
      dir: THREE.Vector3,
      r0: number,
      r1: number,
      bright: number,
    ) => {
      tmp.copy(inner).lerp(outer, 0.35).multiplyScalar(bright);
      spokePos.push(
        dir.x * r0,
        dir.y * r0,
        dir.z * r0,
        dir.x * r1,
        dir.y * r1,
        dir.z * r1,
      );
      spokeCol.push(tmp.r, tmp.g, tmp.b, tmp.r, tmp.g, tmp.b);
    };
    // Bright principal axes (full diameter)
    [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1),
    ].forEach((ax) => {
      pushSpoke(ax, -R, R, 1.0);
    });
    // Burst of shorter spokes in every direction
    for (let i = 0; i < SP; i++) {
      const [dx, dy, dz] = fibDir(i, SP);
      pushSpoke(
        new THREE.Vector3(dx, dy, dz),
        0.1 * R,
        R * (0.8 + Math.random() * 0.25),
        0.4 + Math.random() * 0.4,
      );
    }
    const spokePosArr = new Float32Array(spokePos);
    const spokeColArr = new Float32Array(spokeCol);

    // --- Embedded rectangular panels ----------------------------------
    const PANELS = mobile ? 3 : 5;
    const panel: number[] = [];
    for (let i = 0; i < PANELS; i++) {
      const [dx, dy, dz] = fibDir(i * 3 + 1, PANELS * 3 + 2);
      const d = new THREE.Vector3(dx, dy, dz).normalize();
      // Tangent basis at d
      const t1 = new THREE.Vector3()
        .crossVectors(d, new THREE.Vector3(0, 1, 0))
        .normalize();
      if (t1.lengthSq() < 0.01) t1.set(1, 0, 0);
      const t2 = new THREE.Vector3().crossVectors(d, t1).normalize();
      const c = d.clone().multiplyScalar(R * (0.7 + Math.random() * 0.25));
      const w = 0.16 + Math.random() * 0.16;
      const h = 0.12 + Math.random() * 0.16;
      const corners = [
        c.clone().addScaledVector(t1, w).addScaledVector(t2, h),
        c.clone().addScaledVector(t1, -w).addScaledVector(t2, h),
        c.clone().addScaledVector(t1, -w).addScaledVector(t2, -h),
        c.clone().addScaledVector(t1, w).addScaledVector(t2, -h),
      ];
      for (let k = 0; k < 4; k++) {
        const a = corners[k];
        const b = corners[(k + 1) % 4];
        panel.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const panelPos = new Float32Array(panel);

    // --- Data pulses riding the veins ---------------------------------
    const pulseA = new Float32Array(PULSES * 3);
    const pulseB = new Float32Array(PULSES * 3);
    const pulsePhase = new Float32Array(PULSES);
    const pulseSpeed = new Float32Array(PULSES);
    const pulseColor = new Float32Array(PULSES * 3);
    const pulseSize = new Float32Array(PULSES).fill(0.34);
    for (let p = 0; p < PULSES; p++) {
      const e = Math.floor(Math.random() * edgeCount);
      let a = pts[edges[e * 2]];
      let b = pts[edges[e * 2 + 1]];
      if (Math.random() < 0.5) [a, b] = [b, a];
      pulseA.set([a.x, a.y, a.z], p * 3);
      pulseB.set([b.x, b.y, b.z], p * 3);
      pulsePhase[p] = Math.random();
      pulseSpeed[p] = 1 / (2 + Math.random());
      tmp.set(PULSE_COLORS[Math.floor(Math.random() * PULSE_COLORS.length)]);
      pulseColor.set([tmp.r, tmp.g, tmp.b], p * 3);
    }

    // --- Projector base: concentric ground rings ----------------------
    const base: number[] = [];
    const baseY = -R - 0.32;
    [0.5, 0.85, 1.2, 1.55].forEach((rr) => {
      pushRing(
        base,
        rr,
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, baseY, 0),
        120,
      );
    });
    const basePos = new Float32Array(base);

    return {
      nodePos,
      nodeColor,
      nodeSize,
      nodeBright,
      veinPos,
      gridPos,
      spokePosArr,
      spokeColArr,
      panelPos,
      pulseA,
      pulseB,
      pulsePhase,
      pulseSpeed,
      pulseColor,
      pulseSize,
      basePos,
      baseY,
    };
  }, [N, PULSES, MERIDIANS, LATITUDES, mobile]);

  const pulsePosBuf = useMemo(() => new Float32Array(PULSES * 3), [PULSES]);
  const pulseBrightBuf = useMemo(() => new Float32Array(PULSES), [PULSES]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const scroll = typeof window !== "undefined" ? window.scrollY : 0;

    if (spin.current) {
      spin.current.rotation.y = t * 0.14 + scroll * 0.004;
      spin.current.rotation.x = -0.1 + Math.sin(t * 0.25) * 0.05;
    }
    if (baseSpin.current) baseSpin.current.rotation.y = -t * 0.08;

    // Singularity breathing
    const pulse = 0.75 + 0.25 * Math.sin(t * 2.2);
    singularityMat.uniforms.uIntensity.value = pulse;
    baseMat.uniforms.uIntensity.value = 0.7 + 0.3 * Math.sin(t * 1.3 + 1.0);
    if (coreMesh.current) {
      const sc = 1 + 0.12 * Math.sin(t * 2.2);
      coreMesh.current.scale.setScalar(sc);
    }

    // Energy pulses along the veins
    const { pulseA, pulseB, pulsePhase, pulseSpeed } = data;
    for (let p = 0; p < PULSES; p++) {
      const prog = (t * pulseSpeed[p] + pulsePhase[p]) % 1;
      const p3 = p * 3;
      pulsePosBuf[p3] = pulseA[p3] + (pulseB[p3] - pulseA[p3]) * prog;
      pulsePosBuf[p3 + 1] =
        pulseA[p3 + 1] + (pulseB[p3 + 1] - pulseA[p3 + 1]) * prog;
      pulsePosBuf[p3 + 2] =
        pulseA[p3 + 2] + (pulseB[p3 + 2] - pulseA[p3 + 2]) * prog;
      pulseBrightBuf[p] = Math.sin(prog * Math.PI);
    }
    if (pulsesGeo.current) {
      pulsesGeo.current.attributes.position.needsUpdate = true;
      pulsesGeo.current.attributes.aBright.needsUpdate = true;
    }
  });

  return (
    <group>
      <group ref={spin}>
        {/* Wireframe globe grid */}
        <lineSegments renderOrder={1} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.gridPos, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color="#c8631a"
            transparent
            opacity={0.28}
            depthTest={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>

        {/* Radial burst spokes */}
        <lineSegments renderOrder={2} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.spokePosArr, 3]} />
            <bufferAttribute attach="attributes-color" args={[data.spokeColArr, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.85}
            depthTest={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>

        {/* Crisscrossing connection veins */}
        <lineSegments renderOrder={2} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.veinPos, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color="#ff8534"
            transparent
            opacity={0.5}
            depthTest={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>

        {/* Embedded panels */}
        <lineSegments renderOrder={3} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.panelPos, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color="#ffc061"
            transparent
            opacity={0.8}
            depthTest={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>

        {/* Lattice nodes */}
        <points renderOrder={4} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.nodePos, 3]} />
            <bufferAttribute attach="attributes-aColor" args={[data.nodeColor, 3]} />
            <bufferAttribute attach="attributes-aBright" args={[data.nodeBright, 1]} />
            <bufferAttribute attach="attributes-aSize" args={[data.nodeSize, 1]} />
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

        {/* Energy pulses */}
        <points renderOrder={5} frustumCulled={false}>
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

        {/* Central singularity: solid core + soft bloom */}
        <mesh ref={coreMesh} renderOrder={6}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#fff6da" transparent depthTest={false} />
        </mesh>
        <points renderOrder={6}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0]), 3]}
            />
            <bufferAttribute attach="attributes-aSize" args={[new Float32Array([1.1]), 1]} />
          </bufferGeometry>
          <primitive object={singularityMat} attach="material" />
        </points>
      </group>

      {/* Projector base (counter-rotating) */}
      <group ref={baseSpin}>
        <lineSegments renderOrder={0} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.basePos, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color="#ffa63c"
            transparent
            opacity={0.55}
            depthTest={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
        <points renderOrder={0}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, data.baseY, 0]), 3]}
            />
            <bufferAttribute attach="attributes-aSize" args={[new Float32Array([0.85]), 1]} />
          </bufferGeometry>
          <primitive object={baseMat} attach="material" />
        </points>
      </group>
    </group>
  );
}

export default function UltronCore() {
  return (
    <Canvas
      camera={{ fov: 45, near: 0.1, far: 50, position: [0, 0, 3.9] }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Core />
    </Canvas>
  );
}
