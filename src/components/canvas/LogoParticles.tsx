"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useWebGLSupported } from "@/lib/webgl";

// ─────────────────────────────────────────────────────────────────────────
// The company logo, built ENTIRELY from particles.
//
// There is no logo image anywhere in this scene. The Soft Suave mark's SVG
// path data (below) is rasterized to an offscreen 2D canvas, ~2–3k points
// are sampled from the filled pixels, and those sampled positions become
// the particle targets. The particles ARE the logo at all times:
//
//   1. Only free-floating glowing particles exist at first — no logo.
//   2. Thin lines connect particles by ACTUAL current distance, so the
//      neural network appears organically as particles drift near each
//      other, and locks in as the shape forms.
//   3. Each particle flies (staggered, eased) to its sampled position —
//      the mark assembles out of the swarm.
//   4. Once formed it stays alive: per-particle shimmer, softly pulsing
//      connection lines, and a few particles that occasionally detach,
//      wander, and rejoin.
//
// All motion is computed in the vertex shader from two uniforms (uTime,
// uProgress) — zero per-frame CPU work per particle, comfortably 60fps.
// ─────────────────────────────────────────────────────────────────────────

// Raw path data from the brand mark (viewBox 0 0 31 36). Paths only — the
// SVG file itself is never loaded or shown.
const MARK_PATHS = [
  "M28.9462 8.28184L15.4679 15.7242L6.22567 10.5576L15.4679 5.39099L20.6667 8.28184L24.7743 6.00607L15.4679 0.839447L0 9.38897V11.6647L13.4141 19.1686V29.4404L4.10766 24.2738V18.5536L0 16.2778V26.5495L15.4679 35.1606L17.5859 33.9919V19.1686L26.8282 14.002V24.2738L21.6936 27.1646V31.7161L31 26.5495V9.38897L28.9462 8.28184Z",
  "M17.8425 16.0318L30.1013 9.266L28.9461 8.58942L16.6873 15.3552L17.8425 16.0318Z",
  "M20.6666 6.6822L21.8218 6.06712L17.8425 3.85286L16.6873 4.52944L20.6666 6.6822Z",
  "M2.63124 25.1347V16.8312L0.320679 15.5396V25.1347L15.4677 33.5612L16.6871 32.9461L2.63124 25.1347Z",
];
const VIEW_W = 31;
const VIEW_H = 36;
const RASTER_SCALE = 10; // rasterize at 310×360 for clean sampling
// raster px between samples. At 3 the swarm was too sparse to saturate the
// mark's thin lower strokes (the isolated bottom taper of the cube) into solid
// gold under additive blending, so the base read as unfinished "sand" while the
// dense top cap looked solid. 2 (~11k particles) fills every stroke evenly top
// to bottom while keeping the living-grain texture — still trivial on the GPU
// since all motion is vertex-shader driven.
const SAMPLE_STEP = 2;
const LOGO_HEIGHT = 150; // rendered mark height in CSS px
const LINK_R = 7; // world px — max target distance for a connection pair
const MAX_LINKS_PER_NODE = 3;

// timeline (seconds of *animation* time after the footer scrolls into view —
// accumulated per frame, so it stretches gracefully on throttled devices;
// the footer is told the mark has formed via onFormed, never wall-clock)
const DRIFT_END = 0.9; // pure particle field, no shape yet
const FORM_DUR = 2.4; // staggered flight into the mark

// Reddish gold, top to bottom. The base is a warm amber-gold with a red lean;
// sparkle particles are a brighter (but still warm) gold rather than white-hot,
// so the dense crown reads as rich gold instead of blowing out to white. A
// small lift toward a lighter gold keeps the whole mark luminous and even, but
// it stays firmly in the red-gold family — never washing to white.
const HILITE = new THREE.Color("#FFC066");
const rampColor = (t: number, gold: boolean, out: THREE.Color) => {
  if (gold) return out.set("#FFC873");
  // ONE consistent reddish gold across the whole mark. A small lift toward a
  // lighter gold that INCREASES slightly toward the base keeps the bottom as
  // luminous as the crown, so the mark reads solid and even top to bottom.
  return out.set("#FF8A2E").lerp(HILITE, 0.1 + 0.12 * t);
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Sample particle targets from the rasterized mark. Client-only.
function sampleMark(): { x: number; y: number }[] {
  const w = VIEW_W * RASTER_SCALE;
  const h = VIEW_H * RASTER_SCALE;
  const cnv = document.createElement("canvas");
  cnv.width = w;
  cnv.height = h;
  const ctx = cnv.getContext("2d");
  if (!ctx) return [];
  ctx.scale(RASTER_SCALE, RASTER_SCALE);
  ctx.fillStyle = "#fff";
  for (const d of MARK_PATHS) ctx.fill(new Path2D(d));
  const img = ctx.getImageData(0, 0, w, h).data;
  const rand = mulberry32(0x10c0);
  const pts: { x: number; y: number }[] = [];
  for (let y = 0; y < h; y += SAMPLE_STEP) {
    for (let x = 0; x < w; x += SAMPLE_STEP) {
      // jittered sample inside each cell so rows never read as a grid
      const jx = Math.min(w - 1, x + Math.floor(rand() * SAMPLE_STEP));
      const jy = Math.min(h - 1, y + Math.floor(rand() * SAMPLE_STEP));
      if (img[(jy * w + jx) * 4 + 3] > 120) pts.push({ x: jx, y: jy });
    }
  }
  return pts;
}

// Shared GLSL: one function turns (start, target, delay, seed) into the
// particle's current position — used identically by points AND lines so
// line endpoints always sit exactly on their particles.
const MOTION_GLSL = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;

  float lpOf(float delay) {
    float t = smoothstep(delay, delay + 0.45, uProgress);
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  vec3 particlePos(vec3 s, vec3 tgt, float lp, float seed) {
    // free drift while unformed
    vec2 drift = vec2(
      sin(uTime * (0.35 + fract(seed * 3.1) * 0.4) + seed * 17.0),
      cos(uTime * (0.28 + fract(seed * 5.7) * 0.4) + seed * 29.0)
    ) * 15.0 * (1.0 - lp);
    // alive shimmer once formed
    vec2 shim = vec2(
      sin(uTime * 1.6 + seed * 43.0),
      cos(uTime * 1.9 + seed * 61.0)
    ) * 0.8 * lp;
    // a very few particles occasionally detach, wander out, and rejoin —
    // kept rare and short so the mark never looks scattered or incomplete
    float elig = step(fract(seed * 7.31), 0.018);
    float det = smoothstep(0.986, 1.0, sin(uTime * 0.22 + seed * 40.0)) * elig * lp;
    vec2 dir = normalize(vec2(sin(seed * 90.0), cos(seed * 37.0)) + 0.001);
    vec3 p = mix(s, tgt, lp);
    p.xy += drift + shim + dir * det * 6.0;
    return p;
  }
`;

const pointsVertex = /* glsl */ `
  ${MOTION_GLSL}
  uniform float uDpr;
  attribute vec3 aTarget;
  attribute float aDelay;
  attribute float aSeed;
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vLp;
  void main() {
    float lp = lpOf(aDelay);
    vLp = lp;
    vColor = aColor;
    vec3 p = particlePos(position, aTarget, lp, aSeed);
    gl_PointSize = aSize * uDpr * (0.85 + 0.3 * lp);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const pointsFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying vec3 vColor;
  varying float vLp;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.18, 0.0, d);
    // gentle per-particle twinkle keeps the formed mark alive
    float tw = 0.85 + 0.15 * sin(uTime * 2.1 + vColor.g * 40.0);
    float a = (soft * 0.5 + core * 0.95) * (0.55 + 0.45 * vLp) * tw;
    gl_FragColor = vec4(vColor, a);
  }
`;

const linesVertex = /* glsl */ `
  ${MOTION_GLSL}
  attribute vec3 aTarget;
  attribute float aDelay;
  attribute float aSeed;
  attribute vec3 bStart;
  attribute vec3 bTarget;
  attribute float bDelay;
  attribute float bSeed;
  attribute float aRange;
  varying float vAlpha;
  void main() {
    vec3 pa = particlePos(position, aTarget, lpOf(aDelay), aSeed);
    vec3 pb = particlePos(bStart, bTarget, lpOf(bDelay), bSeed);
    // connect by ACTUAL current distance — links appear as particles near
    // each other and lock in once the shape forms
    float d = distance(pa.xy, pb.xy);
    float near = 1.0 - smoothstep(aRange * 0.2, aRange, d);
    float pulse = 0.7 + 0.3 * sin(uTime * 1.8 + (aSeed + bSeed) * 24.0);
    vAlpha = near * pulse;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pa, 1.0);
  }
`;
const linesFragment = /* glsl */ `
  precision highp float;
  varying float vAlpha;
  void main() {
    // reddish gold to match the particle ramp so the web reads as one colour
    // with the mark rather than a separate highlight
    gl_FragColor = vec4(1.0, 0.58, 0.26, vAlpha * 0.34);
  }
`;

// soft warm ambience behind the mark, swelling as it forms
const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const glowFragment = /* glsl */ `
  precision highp float;
  uniform float uGlow;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float fall = smoothstep(1.0, 0.0, d);
    // cubed falloff keeps the glow tight to the mark so it doesn't spill a
    // haze below/around it; warm reddish-gold tint blends with the mark
    gl_FragColor = vec4(vec3(1.0, 0.5, 0.22), fall * fall * fall * 0.18 * uGlow);
  }
`;

type SwarmProps = {
  active: boolean;
  reduced: boolean;
  center: { x: number; y: number };
  onFormed?: () => void;
};

function Swarm({ active, reduced, center, onFormed }: SwarmProps) {
  const { size } = useThree();
  const dpr = useThree((s) => s.gl.getPixelRatio());
  const T = useRef(0);

  // Materials are created imperatively: R3F's `uniforms` JSX prop copies the
  // uniform objects at mount, so mutating a shared object from useFrame never
  // reaches the GPU. Constructing THREE.ShaderMaterial ourselves guarantees
  // the objects we animate are the ones the materials own.
  const { uniforms, glowUniforms, pointsMat, linesMat, glowMat } = useMemo(() => {
    const uniforms = {
      uTime: { value: 0 },
      uProgress: { value: reduced ? 1 : 0 },
      uDpr: { value: dpr },
    };
    const glowUniforms = { uGlow: { value: reduced ? 1 : 0 } };
    const pointsMat = new THREE.ShaderMaterial({
      vertexShader: pointsVertex,
      fragmentShader: pointsFragment,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const linesMat = new THREE.ShaderMaterial({
      vertexShader: linesVertex,
      fragmentShader: linesFragment,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: glowVertex,
      fragmentShader: glowFragment,
      uniforms: glowUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { uniforms, glowUniforms, pointsMat, linesMat, glowMat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      pointsMat.dispose();
      linesMat.dispose();
      glowMat.dispose();
    },
    [pointsMat, linesMat, glowMat],
  );

  const geo = useMemo(() => {
    const samples = sampleMark();
    const n = samples.length;
    if (!n) return null;

    // world coords: origin at canvas centre, y up
    const cx = center.x - size.width / 2;
    const cy = size.height / 2 - center.y;
    const s = LOGO_HEIGHT / (VIEW_H * RASTER_SCALE);
    const rand = mulberry32(0xf00d);
    const tmp = new THREE.Color();

    const start = new Float32Array(n * 3);
    const target = new Float32Array(n * 3);
    const delay = new Float32Array(n);
    const seed = new Float32Array(n);
    const sizeA = new Float32Array(n);
    const color = new Float32Array(n * 3);

    for (let i = 0; i < n; i++) {
      // scatter starts across the whole footer canvas
      start[i * 3] = (rand() - 0.5) * size.width * 0.9;
      start[i * 3 + 1] = (rand() - 0.5) * size.height * 0.9;
      start[i * 3 + 2] = 0;
      const tx = cx + (samples[i].x - (VIEW_W * RASTER_SCALE) / 2) * s;
      const ty = cy - (samples[i].y - (VIEW_H * RASTER_SCALE) / 2) * s;
      target[i * 3] = tx;
      target[i * 3 + 1] = ty;
      target[i * 3 + 2] = 0;
      delay[i] = rand() * 0.55;
      seed[i] = rand() * 100;
      sizeA[i] = 1.4 + rand() * 1.5;
      // gold sparkle odds rise toward the bottom, so the lower half twinkles
      // as richly as the top instead of fading into flat red
      const tRamp = samples[i].y / (VIEW_H * RASTER_SCALE);
      rampColor(tRamp, rand() < 0.08 + 0.14 * tRamp, tmp);
      color[i * 3] = tmp.r;
      color[i * 3 + 1] = tmp.g;
      color[i * 3 + 2] = tmp.b;
    }

    // neighbour pairs (grid hash), capped per node
    const buildPairs = (
      pos: Float32Array,
      radius: number,
      maxPerNode: number,
      maxTotal: number,
      keep: number,
    ): [number, number][] => {
      const grid = new Map<string, number[]>();
      for (let i = 0; i < n; i++) {
        const k = `${Math.floor(pos[i * 3] / radius)},${Math.floor(pos[i * 3 + 1] / radius)}`;
        const arr = grid.get(k);
        if (arr) arr.push(i);
        else grid.set(k, [i]);
      }
      const linkCount = new Uint8Array(n);
      const out: [number, number][] = [];
      for (let i = 0; i < n && out.length < maxTotal; i++) {
        if (linkCount[i] >= maxPerNode) continue;
        const gx = Math.floor(pos[i * 3] / radius);
        const gy = Math.floor(pos[i * 3 + 1] / radius);
        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const bucket = grid.get(`${gx + ox},${gy + oy}`);
            if (!bucket) continue;
            for (const j of bucket) {
              if (j <= i || linkCount[j] >= maxPerNode) continue;
              if (linkCount[i] >= maxPerNode) break;
              const dx = pos[i * 3] - pos[j * 3];
              const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
              if (dx * dx + dy * dy < radius * radius && rand() < keep) {
                out.push([i, j]);
                linkCount[i]++;
                linkCount[j]++;
              }
            }
          }
        }
      }
      return out;
    };

    // Two link sets, each pair carrying its own visibility range:
    //  - mark links (by target) light up as the shape locks in
    //  - float links (by start) form the loose neural web among the drifting
    //    field, then naturally dissolve as particles fly to their targets
    // Total-link caps MUST scale with the particle count. buildPairs walks
    // particles in sample order (top of the mark first), so any fixed cap the
    // pair count exceeds is spent entirely on the upper mark, starving the lower
    // mark of its connective web — which reads as a solid-gold top over a sparse,
    // unfinished bottom. Bounding by (maxPerNode * n) keeps the caps above what
    // the per-node limits can ever produce, so the per-node caps govern and the
    // web covers the whole mark evenly at any density.
    const floatR = Math.sqrt((size.width * size.height) / n) * 2.0;
    const pairs: [number, number, number][] = [
      ...buildPairs(target, LINK_R, MAX_LINKS_PER_NODE, MAX_LINKS_PER_NODE * n, 0.7).map(
        ([i, j]) => [i, j, LINK_R * 2.3] as [number, number, number],
      ),
      ...buildPairs(start, floatR, 2, 2 * n, 1).map(
        ([i, j]) => [i, j, floatR] as [number, number, number],
      ),
    ];

    // line buffers: each vertex carries its own particle + the other endpoint
    const m = pairs.length * 2;
    const lStart = new Float32Array(m * 3);
    const lTarget = new Float32Array(m * 3);
    const lDelay = new Float32Array(m);
    const lSeed = new Float32Array(m);
    const lbStart = new Float32Array(m * 3);
    const lbTarget = new Float32Array(m * 3);
    const lbDelay = new Float32Array(m);
    const lbSeed = new Float32Array(m);
    const lRange = new Float32Array(m);
    pairs.forEach(([i, j, range], p) => {
      for (const [v, a, b] of [
        [p * 2, i, j],
        [p * 2 + 1, j, i],
      ] as const) {
        lStart.set(start.subarray(a * 3, a * 3 + 3), v * 3);
        lTarget.set(target.subarray(a * 3, a * 3 + 3), v * 3);
        lDelay[v] = delay[a];
        lSeed[v] = seed[a];
        lbStart.set(start.subarray(b * 3, b * 3 + 3), v * 3);
        lbTarget.set(target.subarray(b * 3, b * 3 + 3), v * 3);
        lbDelay[v] = delay[b];
        lbSeed[v] = seed[b];
        lRange[v] = range;
      }
    });

    return {
      n,
      start, target, delay, seed, sizeA, color,
      lStart, lTarget, lDelay, lSeed, lbStart, lbTarget, lbDelay, lbSeed,
      lRange,
      glowPos: [cx, cy, -1] as [number, number, number],
    };
  }, [size.width, size.height, center.x, center.y]);

  // leaving the viewport switches the frameloop off, so useFrame stops and
  // can't do the reset itself — clear the clock here so the whole sequence
  // replays from the drifting field next time the footer scrolls in
  const formedFired = useRef(false);
  useEffect(() => {
    if (!active) {
      T.current = 0;
      formedFired.current = false;
    }
  }, [active]);

  useFrame((_, dt) => {
    if (reduced) {
      uniforms.uProgress.value = 1;
      glowUniforms.uGlow.value = 1;
      return;
    }
    T.current = active ? T.current + Math.min(dt, 0.05) : 0;
    uniforms.uTime.value = T.current;
    uniforms.uProgress.value = Math.max(
      0,
      Math.min(1, (T.current - DRIFT_END) / FORM_DUR),
    );
    glowUniforms.uGlow.value = uniforms.uProgress.value;
    // announce formation from the animation clock itself, so the wordmark
    // stays in sync even when rendering is throttled
    if (uniforms.uProgress.value >= 1 && !formedFired.current) {
      formedFired.current = true;
      onFormed?.();
    }
  });

  if (!geo) return null;

  return (
    <>
      <mesh position={geo.glowPos} material={glowMat}>
        <planeGeometry args={[300, 300]} />
      </mesh>

      {/* the neural links — visible only between currently-near particles */}
      <lineSegments frustumCulled={false} material={linesMat}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[geo.lStart, 3]} />
          <bufferAttribute attach="attributes-aTarget" args={[geo.lTarget, 3]} />
          <bufferAttribute attach="attributes-aDelay" args={[geo.lDelay, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[geo.lSeed, 1]} />
          <bufferAttribute attach="attributes-bStart" args={[geo.lbStart, 3]} />
          <bufferAttribute attach="attributes-bTarget" args={[geo.lbTarget, 3]} />
          <bufferAttribute attach="attributes-bDelay" args={[geo.lbDelay, 1]} />
          <bufferAttribute attach="attributes-bSeed" args={[geo.lbSeed, 1]} />
          <bufferAttribute attach="attributes-aRange" args={[geo.lRange, 1]} />
        </bufferGeometry>
      </lineSegments>

      {/* the particles — these ARE the logo */}
      <points frustumCulled={false} material={pointsMat}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[geo.start, 3]} />
          <bufferAttribute attach="attributes-aTarget" args={[geo.target, 3]} />
          <bufferAttribute attach="attributes-aDelay" args={[geo.delay, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[geo.seed, 1]} />
          <bufferAttribute attach="attributes-aSize" args={[geo.sizeA, 1]} />
          <bufferAttribute attach="attributes-aColor" args={[geo.color, 3]} />
        </bufferGeometry>
      </points>
    </>
  );
}

export default function LogoParticles({
  active,
  reduced,
  center,
  onFormed,
}: {
  active: boolean;
  reduced: boolean;
  center: { x: number; y: number } | null;
  onFormed?: () => void;
}) {
  const webgl = useWebGLSupported();
  // When WebGL can't start, skip the particle canvas but still reveal the
  // wordmark (which normally waits on onFormed) so the footer isn't blank.
  useEffect(() => {
    if (webgl === false) onFormed?.();
  }, [webgl, onFormed]);
  if (!center || webgl === false) return null;
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 100], zoom: 1, near: 0.1, far: 200 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
      frameloop={active || reduced ? "always" : "never"}
    >
      <Swarm
        active={active}
        reduced={reduced}
        center={center}
        onFormed={onFormed}
      />
    </Canvas>
  );
}
