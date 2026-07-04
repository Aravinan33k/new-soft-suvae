"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

// 3D "Ultron AI Core" for the hero — a holographic AI energy core built
// entirely from CIRCULAR geometry (no polygon cage): concentric rings and
// segmented arcs, a bright multi-ring nucleus, organically branching energy
// veins with streams of light flowing along them, orbiting circuit
// fragments, and independently-rotating gyroscope layers. All additive
// orange glow on transparent bg, spinning 360°.
//
// Layer map (each its own independently-rotating group):
//   nucleus  – bright pulsing core + bloom, brightest element
//   inner    – dense fast-spinning rings/arcs + core circuitry (near center)
//   mid      – counter-rotating processing rings + HUD radial slices
//   outer    – slow orbital rings + radial tick marks
//   gyro     – 3 orthogonal-plane rings (the gyroscope cage)
//   frags    – rectangular circuit panels orbiting outside the core
//   veins    – branching curved neural pathways (static) with light streams
//   wave     – an expanding energy shockwave that repeats

const isMobileDevice = () =>
  typeof window !== "undefined" && window.innerWidth < 768;

const R = 1.45; // outer core radius

// --- geometry helpers ------------------------------------------------
function randUnit(): THREE.Vector3 {
  const u = Math.random() * 2 - 1;
  const th = Math.random() * Math.PI * 2;
  const s = Math.sqrt(Math.max(0, 1 - u * u));
  return new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th));
}

// Orthonormal basis for a ring whose axis (normal) is n.
function basisFromAxis(n: THREE.Vector3) {
  const up =
    Math.abs(n.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const U = new THREE.Vector3().crossVectors(n, up).normalize();
  const V = new THREE.Vector3().crossVectors(n, U).normalize();
  return { U, V };
}

// Append arc [a0,a1] (radians) of a circle to a flat segment-pair list.
function pushArc(
  out: number[],
  radius: number,
  U: THREE.Vector3,
  V: THREE.Vector3,
  c: THREE.Vector3,
  segs: number,
  a0 = 0,
  a1 = Math.PI * 2,
) {
  let px = 0;
  let py = 0;
  let pz = 0;
  for (let i = 0; i <= segs; i++) {
    const th = a0 + (a1 - a0) * (i / segs);
    const co = Math.cos(th) * radius;
    const si = Math.sin(th) * radius;
    const x = c.x + U.x * co + V.x * si;
    const y = c.y + U.y * co + V.y * si;
    const z = c.z + U.z * co + V.z * si;
    if (i > 0) out.push(px, py, pz, x, y, z);
    px = x;
    py = y;
    pz = z;
  }
}

// Radial tick marks / HUD slices around a ring plane.
function pushTicks(
  out: number[],
  rIn: number,
  rOut: number,
  U: THREE.Vector3,
  V: THREE.Vector3,
  c: THREE.Vector3,
  count: number,
) {
  for (let k = 0; k < count; k++) {
    const th = (k / count) * Math.PI * 2;
    const ca = Math.cos(th);
    const sa = Math.sin(th);
    out.push(
      c.x + (U.x * ca + V.x * sa) * rIn,
      c.y + (U.y * ca + V.y * sa) * rIn,
      c.z + (U.z * ca + V.z * sa) * rIn,
      c.x + (U.x * ca + V.x * sa) * rOut,
      c.y + (U.y * ca + V.y * sa) * rOut,
      c.z + (U.z * ca + V.z * sa) * rOut,
    );
  }
}

// --- shaders ---------------------------------------------------------
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
    gl_PointSize = clamp(aSize * (42.0 / -mv.z), 1.0, 13.0);
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

const bloomVertex = /* glsl */ `
  attribute float aSize;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * (300.0 / -mv.z), 2.0, 420.0);
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
    float halo = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.1, 0.0, d);
    gl_FragColor = vec4(uColor, (halo * halo * 0.65 + core) * uIntensity);
  }
`;

const STREAM_COLORS = ["#ffe08a", "#ffffff", "#ff9a3c"];

function Core() {
  const spin = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const mid = useRef<THREE.Group>(null);
  const outer = useRef<THREE.Group>(null);
  const gyro = useRef<THREE.Group>(null);
  const frags = useRef<THREE.Group>(null);
  const nucleus = useRef<THREE.Group>(null);
  const coreMesh = useRef<THREE.Mesh>(null);
  const waveGroup = useRef<THREE.Group>(null);
  const waveMat = useRef<THREE.LineBasicMaterial>(null);
  const baseSpin = useRef<THREE.Group>(null);
  const streamsGeo = useRef<THREE.BufferGeometry>(null);

  const mobile = isMobileDevice();
  const SEEDS = mobile ? 10 : 18;
  const STREAMS = mobile ? 46 : 96;
  const MICRO = mobile ? 260 : 520;

  const singularityMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: bloomVertex,
        fragmentShader: bloomFragment,
        uniforms: {
          uColor: { value: new THREE.Color("#fff2cc") },
          uIntensity: { value: 1 },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const baseBloomMat = useMemo(
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
    const cGold = new THREE.Color("#ffe6a6");
    const cAmber = new THREE.Color("#ffab4d");
    const cOrange = new THREE.Color("#ff7a24");
    const tmp = new THREE.Color();

    // ---- Rotating ring layers (built as flat segment lists) ----------
    const innerArr: number[] = [];
    const midArr: number[] = [];
    const outerArr: number[] = [];
    const gyroArr: number[] = [];
    const O = new THREE.Vector3();

    // NUCLEUS RINGS (spin with the inner layer): 5 tight rings, tilted
    [
      [0.11, 0, 1, 0],
      [0.15, 1, 0, 0],
      [0.18, 0, 0, 1],
      [0.14, 1, 1, 0],
      [0.16, 1, 0, 1],
    ].forEach(([rad, ax, ay, az]) => {
      const { U, V } = basisFromAxis(new THREE.Vector3(ax, ay, az).normalize());
      pushArc(innerArr, rad, U, V, O, 72);
    });

    // INNER: dense circuitry near the core — small rings + broken arcs
    for (let i = 0; i < 6; i++) {
      const rad = 0.26 + i * 0.05;
      const axis = randUnit();
      const { U, V } = basisFromAxis(axis);
      if (i % 2 === 0) pushArc(innerArr, rad, U, V, O, 96);
      else {
        // segmented arc with a gap (broken ring — breaks symmetry)
        const start = Math.random() * Math.PI * 2;
        pushArc(innerArr, rad, U, V, O, 60, start, start + Math.PI * 1.4);
      }
    }
    pushTicks(
      innerArr,
      0.5,
      0.56,
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      O,
      36,
    );

    // MID: multi-orbital processing rings + HUD radial slices
    for (let i = 0; i < 4; i++) {
      const rad = 0.68 + i * 0.09;
      const axis = new THREE.Vector3(
        Math.sin(i * 1.3),
        Math.cos(i * 0.7),
        Math.sin(i * 2.1),
      ).normalize();
      const { U, V } = basisFromAxis(axis);
      if (i % 2 === 1) {
        const start = Math.random() * Math.PI * 2;
        pushArc(midArr, rad, U, V, O, 90, start, start + Math.PI * 1.55);
      } else {
        pushArc(midArr, rad, U, V, O, 120);
      }
    }
    // HUD slices around the equator
    pushTicks(
      midArr,
      0.6,
      0.7,
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      O,
      48,
    );

    // OUTER: slow big orbital rings (some broken) + outer tick ring
    for (let i = 0; i < 3; i++) {
      const rad = 1.12 + i * 0.16;
      const axis = new THREE.Vector3(
        Math.sin(i * 2.0 + 1),
        1.6,
        Math.cos(i * 1.4),
      ).normalize();
      const { U, V } = basisFromAxis(axis);
      if (i === 1) {
        const start = Math.random() * Math.PI * 2;
        pushArc(outerArr, rad, U, V, O, 100, start, start + Math.PI * 1.25);
      } else {
        pushArc(outerArr, rad, U, V, O, 140);
      }
    }
    pushTicks(
      outerArr,
      1.42,
      1.5,
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      O,
      72,
    );

    // GYRO: three orthogonal-plane rings — the gyroscope cage
    (
      [
        [1.18, new THREE.Vector3(0, 0, 1)],
        [1.24, new THREE.Vector3(1, 0, 0)],
        [1.0, new THREE.Vector3(1, 1, 0)],
      ] as [number, THREE.Vector3][]
    ).forEach(([rad, axis]) => {
      const { U, V } = basisFromAxis(axis.normalize());
      pushArc(gyroArr, rad, U, V, O, 130);
    });

    // ---- Branching curved energy veins -------------------------------
    const SWIRL = new THREE.Vector3(0.2, 1, 0.1).normalize();
    const paths: THREE.Vector3[][] = [];
    let budget = mobile ? 900 : 1700;
    const queue: { pos: THREE.Vector3; dir: THREE.Vector3; depth: number }[] = [];
    for (let s = 0; s < SEEDS; s++) {
      const d = randUnit();
      queue.push({ pos: d.clone().multiplyScalar(0.22 * R), dir: d.clone(), depth: 0 });
    }
    let guard = 0;
    while (queue.length && budget > 0 && guard < 4000) {
      guard++;
      const w = queue.shift()!;
      const path = [w.pos.clone()];
      let dir = w.dir.clone();
      const maxSteps = 7 + Math.floor(Math.random() * 8) - w.depth * 2;
      let steps = 0;
      while (steps < maxSteps && budget > 0) {
        const rad = w.pos.length();
        if (rad > 1.5 * R) break;
        const outward = w.pos.clone().normalize();
        const swirl = new THREE.Vector3()
          .crossVectors(outward, SWIRL)
          .normalize();
        dir = outward
          .multiplyScalar(0.68)
          .add(dir.multiplyScalar(0.22))
          .add(swirl.multiplyScalar(0.32 * (Math.random() - 0.25)));
        if (dir.lengthSq() < 1e-4) dir = outward;
        dir.normalize();
        const step = 0.1 * R + Math.random() * 0.08 * R;
        w.pos = w.pos.clone().addScaledVector(dir, step);
        path.push(w.pos.clone());
        budget--;
        steps++;
        if (w.depth < 2 && Math.random() < 0.2 && budget > 30) {
          queue.push({
            pos: w.pos.clone(),
            dir: dir.clone().applyAxisAngle(randUnit(), (Math.random() - 0.5) * 1.3),
            depth: w.depth + 1,
          });
        }
      }
      if (path.length >= 2) paths.push(path);
    }

    // Vein line segments + per-path metadata for streams
    const veinSeg: number[] = [];
    const metas: { pts: THREE.Vector3[]; cum: number[]; total: number }[] = [];
    const junctions: THREE.Vector3[] = [];
    for (const path of paths) {
      const cum = [0];
      let total = 0;
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1];
        const b = path[i];
        veinSeg.push(a.x, a.y, a.z, b.x, b.y, b.z);
        total += a.distanceTo(b);
        cum.push(total);
      }
      metas.push({ pts: path, cum, total });
      // node at the tip (and occasionally along)
      junctions.push(path[path.length - 1]);
      if (path.length > 4) junctions.push(path[Math.floor(path.length / 2)]);
    }
    const veinPos = new Float32Array(veinSeg);

    // Junction nodes (glow dots at vein tips / mid points)
    const jN = junctions.length;
    const jPos = new Float32Array(jN * 3);
    const jCol = new Float32Array(jN * 3);
    const jSize = new Float32Array(jN);
    const jBright = new Float32Array(jN);
    junctions.forEach((p, i) => {
      jPos.set([p.x, p.y, p.z], i * 3);
      const tt = THREE.MathUtils.smoothstep(p.length() / R, 0.2, 1.1);
      tmp.copy(cGold).lerp(cOrange, tt);
      jCol.set([tmp.r, tmp.g, tmp.b], i * 3);
      jSize[i] = 0.3 + Math.random() * 0.4;
      jBright[i] = 0.7 + Math.random() * 0.5;
    });

    // ---- Micro nodes: density biased toward the center ---------------
    const microPos = new Float32Array(MICRO * 3);
    const microCol = new Float32Array(MICRO * 3);
    const microSize = new Float32Array(MICRO);
    const microBright = new Float32Array(MICRO);
    for (let i = 0; i < MICRO; i++) {
      const d = randUnit();
      const rad = R * Math.pow(Math.random(), 1.7); // dense near center
      const p = d.multiplyScalar(rad);
      microPos.set([p.x, p.y, p.z], i * 3);
      const tt = THREE.MathUtils.smoothstep(rad / R, 0.0, 1.0);
      tmp.copy(cGold).lerp(cOrange, tt);
      microCol.set([tmp.r, tmp.g, tmp.b], i * 3);
      microSize[i] = 0.12 + Math.random() * 0.16;
      microBright[i] = 0.4 + Math.random() * 0.5;
    }

    // ---- Radial circuit-trace spokes from the center -----------------
    const spokePos: number[] = [];
    const spokeCol: number[] = [];
    const SP = mobile ? 16 : 26;
    const pushSpoke = (dir: THREE.Vector3, r0: number, r1: number, b: number) => {
      tmp.copy(cAmber).multiplyScalar(b);
      spokePos.push(dir.x * r0, dir.y * r0, dir.z * r0, dir.x * r1, dir.y * r1, dir.z * r1);
      spokeCol.push(tmp.r, tmp.g, tmp.b, tmp.r, tmp.g, tmp.b);
    };
    [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1),
    ].forEach((ax) => pushSpoke(ax, -R * 0.95, R * 0.95, 1.0));
    for (let i = 0; i < SP; i++) {
      const d = randUnit();
      pushSpoke(d, 0.12 * R, R * (0.7 + Math.random() * 0.3), 0.35 + Math.random() * 0.4);
    }
    const spokePosArr = new Float32Array(spokePos);
    const spokeColArr = new Float32Array(spokeCol);

    // ---- Orbiting circuit fragments (rectangular panels) -------------
    const PANELS = mobile ? 4 : 7;
    const fragArr: number[] = [];
    for (let i = 0; i < PANELS; i++) {
      const d = randUnit();
      const t1 = new THREE.Vector3()
        .crossVectors(d, new THREE.Vector3(0, 1, 0))
        .normalize();
      if (t1.lengthSq() < 0.01) t1.set(1, 0, 0);
      const t2 = new THREE.Vector3().crossVectors(d, t1).normalize();
      // some panels orbit OUTSIDE the core
      const c = d.clone().multiplyScalar(R * (0.85 + Math.random() * 0.7));
      const w = 0.14 + Math.random() * 0.18;
      const h = 0.1 + Math.random() * 0.16;
      const corners = [
        c.clone().addScaledVector(t1, w).addScaledVector(t2, h),
        c.clone().addScaledVector(t1, -w).addScaledVector(t2, h),
        c.clone().addScaledVector(t1, -w).addScaledVector(t2, -h),
        c.clone().addScaledVector(t1, w).addScaledVector(t2, -h),
      ];
      for (let k = 0; k < 4; k++) {
        const a = corners[k];
        const b = corners[(k + 1) % 4];
        fragArr.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
      // one internal trace line for a "chip" look
      fragArr.push(
        corners[0].x, corners[0].y, corners[0].z,
        corners[2].x, corners[2].y, corners[2].z,
      );
    }
    const fragPos = new Float32Array(fragArr);

    // ---- Streams assignment ------------------------------------------
    const streamMeta = new Int32Array(STREAMS);
    const streamDir = new Float32Array(STREAMS);
    const streamSpeed = new Float32Array(STREAMS);
    const streamPhase = new Float32Array(STREAMS);
    const streamColor = new Float32Array(STREAMS * 3);
    const streamSize = new Float32Array(STREAMS).fill(0.36);
    for (let i = 0; i < STREAMS; i++) {
      streamMeta[i] = metas.length ? Math.floor(Math.random() * metas.length) : 0;
      streamDir[i] = Math.random() < 0.7 ? 1 : -1; // mostly center -> edge
      streamSpeed[i] = 0.28 + Math.random() * 0.4;
      streamPhase[i] = Math.random();
      tmp.set(STREAM_COLORS[Math.floor(Math.random() * STREAM_COLORS.length)]);
      streamColor.set([tmp.r, tmp.g, tmp.b], i * 3);
    }

    // ---- Expanding energy wave ring (equatorial) ---------------------
    const wave: number[] = [];
    pushArc(
      wave,
      1.0,
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      O,
      120,
    );
    const wavePos = new Float32Array(wave);

    // ---- Projector base ----------------------------------------------
    const base: number[] = [];
    const baseY = -R - 0.3;
    [0.5, 0.85, 1.2, 1.55].forEach((rr) =>
      pushArc(
        base,
        rr,
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, baseY, 0),
        120,
      ),
    );
    const basePos = new Float32Array(base);

    return {
      innerArr: new Float32Array(innerArr),
      midArr: new Float32Array(midArr),
      outerArr: new Float32Array(outerArr),
      gyroArr: new Float32Array(gyroArr),
      veinPos,
      jPos,
      jCol,
      jSize,
      jBright,
      microPos,
      microCol,
      microSize,
      microBright,
      spokePosArr,
      spokeColArr,
      fragPos,
      metas,
      streamMeta,
      streamDir,
      streamSpeed,
      streamPhase,
      streamColor,
      streamSize,
      wavePos,
      basePos,
      baseY,
    };
  }, [SEEDS, STREAMS, MICRO, mobile]);

  const streamPosBuf = useMemo(() => new Float32Array(STREAMS * 3), [STREAMS]);
  const streamBrightBuf = useMemo(() => new Float32Array(STREAMS), [STREAMS]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const scroll = typeof window !== "undefined" ? window.scrollY : 0;

    if (spin.current) {
      spin.current.rotation.y = t * 0.1 + scroll * 0.004;
      spin.current.rotation.x = -0.08 + Math.sin(t * 0.2) * 0.04;
    }
    // Independent motion layers
    if (inner.current) {
      inner.current.rotation.y = t * 0.55;
      inner.current.rotation.x = t * 0.24;
    }
    if (mid.current) {
      mid.current.rotation.y = -t * 0.3;
      mid.current.rotation.z = t * 0.14;
    }
    if (outer.current) outer.current.rotation.y = t * 0.16;
    if (gyro.current) {
      gyro.current.rotation.x = t * 0.34;
      gyro.current.rotation.z = -t * 0.2;
    }
    if (frags.current) {
      frags.current.rotation.y = t * 0.18;
      frags.current.rotation.x = Math.sin(t * 0.4) * 0.2;
    }
    if (baseSpin.current) baseSpin.current.rotation.y = -t * 0.08;

    // Nucleus pulse
    const pulse = 0.75 + 0.25 * Math.sin(t * 2.4);
    singularityMat.uniforms.uIntensity.value = pulse;
    baseBloomMat.uniforms.uIntensity.value = 0.7 + 0.3 * Math.sin(t * 1.3 + 1);
    if (coreMesh.current) coreMesh.current.scale.setScalar(1 + 0.14 * Math.sin(t * 2.4));

    // Expanding energy wave (repeats every 4.5s)
    if (waveGroup.current && waveMat.current) {
      const ph = (t % 4.5) / 4.5;
      const sc = 0.35 + ph * 1.5;
      waveGroup.current.scale.set(sc, sc, sc);
      waveMat.current.opacity = (1 - ph) * 0.5;
    }

    // Energy streams flowing along the veins
    const { metas, streamMeta, streamDir, streamSpeed, streamPhase } = data;
    if (metas.length) {
      for (let i = 0; i < STREAMS; i++) {
        const meta = metas[streamMeta[i]];
        let u = (t * streamSpeed[i] + streamPhase[i]) % 1;
        if (streamDir[i] < 0) u = 1 - u;
        const target = u * meta.total;
        const cum = meta.cum;
        const pts = meta.pts;
        let s = 1;
        while (s < cum.length - 1 && cum[s] < target) s++;
        const a = pts[s - 1];
        const b = pts[s];
        const segLen = cum[s] - cum[s - 1] || 1;
        const f = Math.min(1, Math.max(0, (target - cum[s - 1]) / segLen));
        const o = i * 3;
        streamPosBuf[o] = a.x + (b.x - a.x) * f;
        streamPosBuf[o + 1] = a.y + (b.y - a.y) * f;
        streamPosBuf[o + 2] = a.z + (b.z - a.z) * f;
        streamBrightBuf[i] = 0.6 + 0.4 * Math.sin(u * Math.PI);
      }
      if (streamsGeo.current) {
        streamsGeo.current.attributes.position.needsUpdate = true;
        streamsGeo.current.attributes.aBright.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      <group ref={spin}>
        {/* Radial circuit-trace spokes */}
        <lineSegments renderOrder={1} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.spokePosArr, 3]} />
            <bufferAttribute attach="attributes-color" args={[data.spokeColArr, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.7}
            depthTest={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>

        {/* Branching energy veins */}
        <lineSegments renderOrder={2} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.veinPos, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color="#ff8a34"
            transparent
            opacity={0.42}
            depthTest={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>

        {/* Micro nodes (dense near core) */}
        <points renderOrder={3} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.microPos, 3]} />
            <bufferAttribute attach="attributes-aColor" args={[data.microCol, 3]} />
            <bufferAttribute attach="attributes-aBright" args={[data.microBright, 1]} />
            <bufferAttribute attach="attributes-aSize" args={[data.microSize, 1]} />
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

        {/* Vein junction nodes */}
        <points renderOrder={4} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.jPos, 3]} />
            <bufferAttribute attach="attributes-aColor" args={[data.jCol, 3]} />
            <bufferAttribute attach="attributes-aBright" args={[data.jBright, 1]} />
            <bufferAttribute attach="attributes-aSize" args={[data.jSize, 1]} />
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

        {/* Energy streams */}
        <points renderOrder={5} frustumCulled={false}>
          <bufferGeometry ref={streamsGeo}>
            <bufferAttribute attach="attributes-position" args={[streamPosBuf, 3]} />
            <bufferAttribute attach="attributes-aColor" args={[data.streamColor, 3]} />
            <bufferAttribute attach="attributes-aBright" args={[streamBrightBuf, 1]} />
            <bufferAttribute attach="attributes-aSize" args={[data.streamSize, 1]} />
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

        {/* Rotating ring layers */}
        <group ref={inner}>
          <lineSegments renderOrder={4} frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[data.innerArr, 3]} />
            </bufferGeometry>
            <lineBasicMaterial
              color="#ffd98a"
              transparent
              opacity={0.72}
              depthTest={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </lineSegments>
        </group>
        <group ref={mid}>
          <lineSegments renderOrder={3} frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[data.midArr, 3]} />
            </bufferGeometry>
            <lineBasicMaterial
              color="#ff9a3c"
              transparent
              opacity={0.5}
              depthTest={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </lineSegments>
        </group>
        <group ref={outer}>
          <lineSegments renderOrder={2} frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[data.outerArr, 3]} />
            </bufferGeometry>
            <lineBasicMaterial
              color="#e07a1e"
              transparent
              opacity={0.4}
              depthTest={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </lineSegments>
        </group>
        <group ref={gyro}>
          <lineSegments renderOrder={2} frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[data.gyroArr, 3]} />
            </bufferGeometry>
            <lineBasicMaterial
              color="#ff8a3d"
              transparent
              opacity={0.45}
              depthTest={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </lineSegments>
        </group>

        {/* Orbiting circuit fragments */}
        <group ref={frags}>
          <lineSegments renderOrder={3} frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[data.fragPos, 3]} />
            </bufferGeometry>
            <lineBasicMaterial
              color="#ffc061"
              transparent
              opacity={0.75}
              depthTest={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </lineSegments>
        </group>

        {/* Expanding energy wave */}
        <group ref={waveGroup}>
          <lineSegments renderOrder={1} frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[data.wavePos, 3]} />
            </bufferGeometry>
            <lineBasicMaterial
              ref={waveMat}
              color="#ffb457"
              transparent
              opacity={0.4}
              depthTest={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </lineSegments>
        </group>

        {/* Central nucleus: solid core + soft bloom */}
        <group ref={nucleus}>
          <mesh ref={coreMesh} renderOrder={6}>
            <sphereGeometry args={[0.075, 16, 16]} />
            <meshBasicMaterial color="#fff7e0" transparent depthTest={false} />
          </mesh>
          <points renderOrder={6}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([0, 0, 0]), 3]}
              />
              <bufferAttribute attach="attributes-aSize" args={[new Float32Array([1.2]), 1]} />
            </bufferGeometry>
            <primitive object={singularityMat} attach="material" />
          </points>
        </group>
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
          <primitive object={baseBloomMat} attach="material" />
        </points>
      </group>
    </group>
  );
}

export default function UltronCore() {
  return (
    <Canvas
      camera={{ fov: 45, near: 0.1, far: 50, position: [0, 0, 4.1] }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Core />
    </Canvas>
  );
}
