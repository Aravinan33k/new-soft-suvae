"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

// Holographic AI core ("Ultron / Arc Reactor" style) for the hero.
//
// Designed to read like the reference: a blazing white-hot nucleus, fine
// filigree circuitry (thin arcs + PCB elbow traces) rather than chunky
// blocks, dashed radial data spokes, thousands of tiny glowing node dots
// wherever a line ends or bends, a dark ember-colored rim with a blocky
// castellated edge, and a few floating holographic panels. Everything
// stays inside a spherical boundary of radius R.
//
// Layer map (each group rotates independently, in-plane around Z):
//   core    – nucleus rings + burst spokes + layered bloom, fast
//   layerA  – inner circuitry band (holds the feature panels), counter
//   layerB  – middle processing band
//   layerC  – outer shell band with castellated rim, slow
//   spokes  – dashed radial data highways, very slow
//   tilt    – a few gently-tilted rings for volume
//   plates  – three drifting groups of small holographic panels
//   halo    – dim orbiting particles
//   pulses  – energy dots flowing around ring paths
//   wave    – repeating expanding ring

const isMobileDevice = () =>
  typeof window !== "undefined" && window.innerWidth < 768;

const R = 1.45; // spherical boundary — nothing is generated beyond this

const C_GOLD = new THREE.Color("#ffdf94");
const C_AMBER = new THREE.Color("#ff9636");
const C_ORANGE = new THREE.Color("#e85f06");
const C_EMBER = new THREE.Color("#a84a05");

// gold near the core -> amber -> deep ember at the rim
function radialColor(r: number, out: THREE.Color) {
  const t = THREE.MathUtils.clamp((r - 0.12) / (R - 0.12), 0, 1);
  if (t < 0.45) out.copy(C_GOLD).lerp(C_AMBER, t / 0.45);
  else if (t < 0.8) out.copy(C_AMBER).lerp(C_ORANGE, (t - 0.45) / 0.35);
  else out.copy(C_ORANGE).lerp(C_EMBER, (t - 0.8) / 0.2);
  return out;
}

// --- geometry builder --------------------------------------------------
// Accumulates thin line segments, translucent quad fills and glowing node
// dots into flat arrays; one builder per rotation layer.
class LayerBuilder {
  line: number[] = [];
  lineCol: number[] = [];
  fill: number[] = [];
  fillCol: number[] = [];
  nodePos: number[] = [];
  nodeCol: number[] = [];
  nodeSize: number[] = [];
  nodeBright: number[] = [];
  private tmp = new THREE.Color();

  seg(
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    c: THREE.Color, b: number,
  ) {
    this.line.push(x1, y1, z1, x2, y2, z2);
    this.lineCol.push(c.r * b, c.g * b, c.b * b, c.r * b, c.g * b, c.b * b);
  }

  // glowing dot — the sparkle the reference is full of
  node(x: number, y: number, z: number, bright: number, size: number, c?: THREE.Color) {
    const col = c ?? radialColor(Math.hypot(x, y), this.tmp);
    this.nodePos.push(x, y, z);
    this.nodeCol.push(col.r, col.g, col.b);
    this.nodeSize.push(size);
    this.nodeBright.push(bright);
  }

  // arc in the XY plane at height z; a1 < a0 is allowed
  arc(r: number, z: number, a0: number, a1: number, c: THREE.Color, b: number) {
    const span = Math.abs(a1 - a0);
    const segs = Math.max(3, Math.ceil((span / (Math.PI * 2)) * (40 + r * 90)));
    let px = 0, py = 0;
    for (let i = 0; i <= segs; i++) {
      const th = a0 + (a1 - a0) * (i / segs);
      const x = Math.cos(th) * r;
      const y = Math.sin(th) * r;
      if (i > 0) this.seg(px, py, z, x, y, z, c, b);
      px = x;
      py = y;
    }
  }

  // segmented ring: 3-9 thin arc blocks with gaps; block tips get nodes
  ring(r: number, z: number, bright: number) {
    const c = radialColor(r, this.tmp);
    const roll = Math.random();
    if (roll < 0.15) {
      this.arc(r, z, 0, Math.PI * 2, c, bright * 0.8);
      return;
    }
    const blocks = 3 + Math.floor(Math.random() * 7);
    let th = Math.random() * Math.PI * 2;
    for (let k = 0; k < blocks; k++) {
      const len = (0.25 + Math.random() * 1.1) * ((Math.PI * 2) / blocks);
      const gap = (0.08 + Math.random() * 0.5) * ((Math.PI * 2) / blocks) * 0.45;
      const b = bright * (0.45 + Math.random() * 0.65);
      this.arc(r, z, th, th + len, c, b);
      // bright dots at the segment tips — key reference detail
      if (Math.random() < 0.65)
        this.node(Math.cos(th) * r, Math.sin(th) * r, z, 0.8 + Math.random() * 0.5, 0.12 + Math.random() * 0.1);
      if (Math.random() < 0.65)
        this.node(Math.cos(th + len) * r, Math.sin(th + len) * r, z, 0.8 + Math.random() * 0.5, 0.12 + Math.random() * 0.1);
      th += len + gap;
    }
  }

  // radial connection bridges between two ring radii, over a partial span
  ticks(r0: number, r1: number, z: number, count: number, bright: number) {
    const a0 = Math.random() * Math.PI * 2;
    const span = Math.PI * (0.4 + Math.random() * 1.6);
    for (let k = 0; k < count; k++) {
      const th = a0 + (k / count) * span;
      const ca = Math.cos(th), sa = Math.sin(th);
      const c = radialColor((r0 + r1) / 2, this.tmp);
      this.seg(ca * r0, sa * r0, z, ca * r1, sa * r1, z, c, bright * (0.4 + Math.random() * 0.5));
    }
  }

  // small rectangular circuit module tangent to its ring (kept SMALL —
  // the reference reads as filigree, not confetti)
  module(r: number, th: number, z: number, bright: number) {
    const ca = Math.cos(th), sa = Math.sin(th);
    const tx = -sa, ty = ca; // tangent
    const w = 0.016 + Math.random() * 0.04; // along tangent
    const h = 0.008 + Math.random() * 0.022; // along radial
    const cx = ca * r, cy = sa * r;
    const px: number[] = [], py: number[] = [];
    for (const [su, sv] of [[1, 1], [-1, 1], [-1, -1], [1, -1]] as const) {
      px.push(cx + tx * w * su + ca * h * sv);
      py.push(cy + ty * w * su + sa * h * sv);
    }
    const c = radialColor(r, this.tmp);
    for (let k = 0; k < 4; k++) {
      const n = (k + 1) % 4;
      this.seg(px[k], py[k], z, px[n], py[n], z, c, bright);
    }
    const fb = bright * 0.22;
    this.fill.push(
      px[0], py[0], z, px[1], py[1], z, px[2], py[2], z,
      px[0], py[0], z, px[2], py[2], z, px[3], py[3], z,
    );
    for (let k = 0; k < 6; k++) this.fillCol.push(c.r * fb, c.g * fb, c.b * fb);
    if (Math.random() < 0.4)
      this.node(px[0], py[0], z, 0.9 + Math.random() * 0.4, 0.1 + Math.random() * 0.08);
  }

  // larger holographic feature panel (the reference has one or two near
  // the core) — outline, translucent fill, inner detail lines
  panel(cx: number, cy: number, z: number, w: number, h: number, rot: number, bright: number) {
    const c = radialColor(Math.hypot(cx, cy), this.tmp);
    const ux = Math.cos(rot), uy = Math.sin(rot);
    const vx = -uy, vy = ux;
    const corner = (su: number, sv: number) => [cx + ux * w * su + vx * h * sv, cy + uy * w * su + vy * h * sv];
    const cs = [corner(1, 1), corner(-1, 1), corner(-1, -1), corner(1, -1)];
    for (let k = 0; k < 4; k++) {
      const n = (k + 1) % 4;
      this.seg(cs[k][0], cs[k][1], z, cs[n][0], cs[n][1], z, c, bright);
      this.node(cs[k][0], cs[k][1], z, 1.1, 0.14);
    }
    this.fill.push(
      cs[0][0], cs[0][1], z, cs[1][0], cs[1][1], z, cs[2][0], cs[2][1], z,
      cs[0][0], cs[0][1], z, cs[2][0], cs[2][1], z, cs[3][0], cs[3][1], z,
    );
    const fb = bright * 0.38;
    for (let k = 0; k < 6; k++) this.fillCol.push(c.r * fb, c.g * fb, c.b * fb);
    // inner detail: a few horizontal scan lines
    for (let s = 1; s <= 3; s++) {
      const sv = -1 + (s / 2) * 1;
      const a = [cx - ux * w * 0.7 + vx * h * sv * 0.6, cy - uy * w * 0.7 + vy * h * sv * 0.6];
      const b2 = [cx + ux * w * 0.7 + vx * h * sv * 0.6, cy + uy * w * 0.7 + vy * h * sv * 0.6];
      this.seg(a[0], a[1], z, b2[0], b2[1], z, c, bright * 0.45);
    }
  }

  // PCB elbow trace: thin radial step -> arc step, repeated; every bend
  // and the terminal get a glowing node dot
  trace(r0: number, th0: number, z: number, rMax: number) {
    let r = r0, th = th0;
    const b = 0.28 + Math.random() * 0.3;
    const elbows = 2 + Math.floor(Math.random() * 3);
    for (let e = 0; e < elbows; e++) {
      const c = radialColor(r, this.tmp);
      const rNew = Math.min(rMax - 0.02, r + 0.04 + Math.random() * 0.12);
      this.seg(Math.cos(th) * r, Math.sin(th) * r, z, Math.cos(th) * rNew, Math.sin(th) * rNew, z, c, b);
      r = rNew;
      if (Math.random() < 0.55)
        this.node(Math.cos(th) * r, Math.sin(th) * r, z, 0.7 + Math.random() * 0.5, 0.09 + Math.random() * 0.08);
      const dth = (Math.random() < 0.5 ? -1 : 1) * (0.08 + Math.random() * 0.35);
      this.arc(r, z, th, th + dth, c, b);
      th += dth;
      if (r >= rMax - 0.03) break;
    }
    this.node(Math.cos(th) * r, Math.sin(th) * r, z, 1 + Math.random() * 0.5, 0.12 + Math.random() * 0.1);
  }

  // blocky castellated rim: arc blocks alternating between two radii with
  // radial caps — the stepped outer edge of the reference
  notchRing(rHi: number, z: number, bright: number) {
    const rLo = rHi - (0.04 + Math.random() * 0.04);
    const blocks = 20 + Math.floor(Math.random() * 12);
    let th = Math.random() * Math.PI * 2;
    let prevR: number | null = null;
    for (let k = 0; k < blocks; k++) {
      const span = ((Math.PI * 2) / blocks) * (0.55 + Math.random() * 0.4);
      const rB = Math.random() < 0.5 ? rHi : rLo;
      const c = radialColor(rB, this.tmp);
      const b = bright * (0.5 + Math.random() * 0.5);
      this.arc(rB, z, th, th + span, c, b);
      if (prevR !== null && prevR !== rB)
        this.seg(Math.cos(th) * prevR, Math.sin(th) * prevR, z, Math.cos(th) * rB, Math.sin(th) * rB, z, c, b);
      if (Math.random() < 0.4)
        this.node(Math.cos(th) * rB, Math.sin(th) * rB, z, 0.8 + Math.random() * 0.4, 0.1);
      prevR = rB;
      th += span + ((Math.PI * 2) / blocks) * (Math.random() * 0.25);
    }
  }

  build() {
    return {
      line: new Float32Array(this.line),
      lineCol: new Float32Array(this.lineCol),
      fill: new Float32Array(this.fill),
      fillCol: new Float32Array(this.fillCol),
      nodePos: new Float32Array(this.nodePos),
      nodeCol: new Float32Array(this.nodeCol),
      nodeSize: new Float32Array(this.nodeSize),
      nodeBright: new Float32Array(this.nodeBright),
    };
  }
}

type LayerData = ReturnType<LayerBuilder["build"]>;

// one circuitry band: thin rings + bridges + small modules + many fine
// elbow traces, spread over shallow z-planes
function buildBand(
  rMin: number, rMax: number, ringCount: number,
  density: number, zSpread: number, notchedRim = false,
): LayerData {
  const b = new LayerBuilder();
  for (let i = 0; i < ringCount; i++) {
    const r = THREE.MathUtils.lerp(rMin, rMax, ringCount === 1 ? 0.5 : i / (ringCount - 1))
      + (Math.random() - 0.5) * 0.015;
    const z = (Math.random() - 0.5) * zSpread;
    b.ring(r, z, 0.62);
    const mods = Math.floor(r * 6 * density * (0.4 + Math.random()));
    for (let m = 0; m < mods; m++)
      b.module(r, Math.random() * Math.PI * 2, z, 0.55 + Math.random() * 0.4);
    if (i < ringCount - 1 && Math.random() < 0.55) {
      const rNext = THREE.MathUtils.lerp(rMin, rMax, (i + 1) / (ringCount - 1));
      b.ticks(r, rNext, z, 5 + Math.floor(Math.random() * 12), 0.4);
    }
  }
  const traces = Math.floor(ringCount * 9 * density);
  for (let k = 0; k < traces; k++) {
    const r0 = rMin + Math.random() * (rMax - rMin) * 0.8;
    b.trace(r0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * zSpread, rMax);
  }
  if (notchedRim) {
    b.notchRing(rMax, 0, 0.8);
    b.notchRing(rMax - 0.09, (Math.random() - 0.5) * 0.05, 0.6);
  }
  return b.build();
}

// the nucleus: blazing center — tight bright rings, a short radial burst,
// and sparks; the brightest thing in the scene
function buildCore(): LayerData {
  const b = new LayerBuilder();
  const gold = new THREE.Color("#ffedbf");
  const white = new THREE.Color("#fff8ea");
  for (let i = 0; i < 9; i++) {
    const r = 0.06 + i * 0.032;
    const bright = 1.7 - i * 0.12;
    if (i % 3 === 2) {
      const blocks = 4 + Math.floor(Math.random() * 4);
      let th = Math.random() * Math.PI * 2;
      for (let k = 0; k < blocks; k++) {
        const len = (0.5 + Math.random() * 0.8) * ((Math.PI * 2) / blocks) * 0.8;
        b.arc(r, 0, th, th + len, gold, bright);
        th += (Math.PI * 2) / blocks;
      }
    } else {
      b.arc(r, 0, 0, Math.PI * 2, gold, bright);
    }
  }
  // short radial burst around the nucleus
  for (let k = 0; k < 28; k++) {
    const th = (k / 28) * Math.PI * 2 + Math.random() * 0.1;
    const r0 = 0.09 + Math.random() * 0.05;
    const r1 = r0 + 0.08 + Math.random() * 0.16;
    b.seg(Math.cos(th) * r0, Math.sin(th) * r0, 0, Math.cos(th) * r1, Math.sin(th) * r1, 0, gold, 0.7 + Math.random() * 0.6);
    if (Math.random() < 0.6) b.node(Math.cos(th) * r1, Math.sin(th) * r1, 0, 1.2, 0.12, white);
  }
  // fine tick crown
  for (let k = 0; k < 56; k++) {
    const th = (k / 56) * Math.PI * 2;
    b.seg(Math.cos(th) * 0.3, Math.sin(th) * 0.3, 0, Math.cos(th) * 0.335, Math.sin(th) * 0.335, 0, gold, k % 4 === 0 ? 1.2 : 0.6);
  }
  // sparks inside the hot zone
  for (let k = 0; k < 40; k++) {
    const th = Math.random() * Math.PI * 2;
    const r = 0.06 + Math.random() * 0.28;
    b.node(Math.cos(th) * r, Math.sin(th) * r, (Math.random() - 0.5) * 0.04, 0.9 + Math.random() * 0.8, 0.08 + Math.random() * 0.1, white);
  }
  return b.build();
}

// dashed radial data highways from the core to the rim, with node dots —
// prominent in the reference (in-plane radial structure, not stray rays)
function buildSpokes(major: number, minor: number): LayerData {
  const b = new LayerBuilder();
  const tmp = new THREE.Color();
  for (let k = 0; k < major; k++) {
    const th = (k / major) * Math.PI * 2 + (Math.random() - 0.5) * 0.12;
    const ca = Math.cos(th), sa = Math.sin(th);
    let r = 0.17 + Math.random() * 0.1;
    const rEnd = R * (0.82 + Math.random() * 0.16);
    const z = (Math.random() - 0.5) * 0.05;
    while (r < rEnd) {
      const dash = 0.05 + Math.random() * 0.18;
      const r1 = Math.min(rEnd, r + dash);
      const c = radialColor((r + r1) / 2, tmp);
      b.seg(ca * r, sa * r, z, ca * r1, sa * r1, z, c, 0.45 + Math.random() * 0.35);
      if (Math.random() < 0.45) b.node(ca * r1, sa * r1, z, 0.8 + Math.random() * 0.5, 0.1 + Math.random() * 0.07);
      r = r1 + 0.02 + Math.random() * 0.07;
    }
  }
  // minor short radial dashes scattered mid-disc
  for (let k = 0; k < minor; k++) {
    const th = Math.random() * Math.PI * 2;
    const ca = Math.cos(th), sa = Math.sin(th);
    const r0 = 0.4 + Math.random() * (R - 0.5);
    const r1 = r0 + 0.04 + Math.random() * 0.1;
    const c = radialColor(r0, tmp);
    b.seg(ca * r0, sa * r0, (Math.random() - 0.5) * 0.08, ca * r1, sa * r1, (Math.random() - 0.5) * 0.08, c, 0.3 + Math.random() * 0.25);
  }
  return b.build();
}

// a few gently tilted rings for spherical volume (shallow tilts only)
function buildTiltRings(): LayerData {
  const b = new LayerBuilder();
  const tmp = new THREE.Color();
  for (let i = 0; i < 5; i++) {
    const r = 0.75 + i * 0.15;
    const tilt = 0.12 + Math.random() * 0.28;
    const c = radialColor(r, tmp);
    const segs = 90;
    let px = 0, py = 0, pz = 0;
    const a0 = Math.random() * Math.PI * 2;
    const span = Math.PI * (i % 2 === 0 ? 2 : 1.2 + Math.random() * 0.6);
    for (let k = 0; k <= segs; k++) {
      const th = a0 + span * (k / segs);
      const x = Math.cos(th) * r;
      const y = Math.sin(th) * r * Math.cos(tilt);
      const z = Math.sin(th) * r * Math.sin(tilt);
      if (k > 0) b.seg(px, py, pz, x, y, z, c, 0.4);
      px = x; py = y; pz = z;
    }
  }
  return b.build();
}

// small floating holographic plates around the shell — subtle, few
function buildPlates(count: number): LayerData {
  const b = new LayerBuilder();
  const tmp = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const th = Math.random() * Math.PI * 2;
    const rad = 0.8 + Math.random() * (R - 0.85);
    const cx = Math.cos(th) * rad;
    const cy = Math.sin(th) * rad * (0.6 + Math.random() * 0.4);
    const cz = (Math.random() - 0.5) * 0.5;
    const spin = Math.random() * Math.PI * 2;
    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, spin),
    );
    const U = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    const V = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const w = 0.03 + Math.random() * 0.06;
    const h = 0.02 + Math.random() * 0.04;
    const c = radialColor(rad, tmp);
    const corner = (su: number, sv: number) => [
      cx + U.x * w * su + V.x * h * sv,
      cy + U.y * w * su + V.y * h * sv,
      cz + U.z * w * su + V.z * h * sv,
    ];
    const cs = [corner(1, 1), corner(-1, 1), corner(-1, -1), corner(1, -1)];
    const bright = 0.5 + Math.random() * 0.35;
    for (let k = 0; k < 4; k++) {
      const n = (k + 1) % 4;
      b.seg(cs[k][0], cs[k][1], cs[k][2], cs[n][0], cs[n][1], cs[n][2], c, bright);
    }
    b.fill.push(...cs[0], ...cs[1], ...cs[2], ...cs[0], ...cs[2], ...cs[3]);
    const fb = bright * 0.22;
    for (let k = 0; k < 6; k++) b.fillCol.push(c.r * fb, c.g * fb, c.b * fb);
    if (Math.random() < 0.5) b.node(cx, cy, cz, 0.8, 0.1);
  }
  return b.build();
}

// --- shaders -----------------------------------------------------------
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
    gl_PointSize = clamp(aSize * (42.0 / -mv.z), 1.0, 14.0);
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
  attribute vec3 aColor;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * (300.0 / -mv.z), 2.0, 640.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const bloomFragment = /* glsl */ `
  precision highp float;
  uniform float uIntensity;
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float halo = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.12, 0.0, d);
    gl_FragColor = vec4(vColor, (halo * halo * 0.55 + core) * uIntensity);
  }
`;

// --- reusable JSX pieces -----------------------------------------------
function LayerLines({ data, opacity = 0.9 }: { data: LayerData; opacity?: number }) {
  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.line, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.lineCol, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={opacity}
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

function LayerFills({ data }: { data: LayerData }) {
  if (data.fill.length === 0) return null;
  return (
    <mesh frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.fill, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.fillCol, 3]} />
      </bufferGeometry>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.45}
        side={THREE.DoubleSide}
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function LayerNodes({ data }: { data: LayerData }) {
  if (data.nodePos.length === 0) return null;
  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.nodePos, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[data.nodeCol, 3]} />
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
  );
}

function Layer({ data, opacity, groupRef, renderOrder }: {
  data: LayerData;
  opacity?: number;
  groupRef: React.RefObject<THREE.Group | null>;
  renderOrder?: number;
}) {
  return (
    <group ref={groupRef} renderOrder={renderOrder}>
      <LayerLines data={data} opacity={opacity} />
      <LayerFills data={data} />
      <LayerNodes data={data} />
    </group>
  );
}

function Core() {
  const assembly = useRef<THREE.Group>(null);
  const coreGrp = useRef<THREE.Group>(null);
  const grpA = useRef<THREE.Group>(null);
  const grpB = useRef<THREE.Group>(null);
  const grpC = useRef<THREE.Group>(null);
  const spokesGrp = useRef<THREE.Group>(null);
  const tiltGrp = useRef<THREE.Group>(null);
  const haloGrp = useRef<THREE.Group>(null);
  const plateGrps = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const coreMesh = useRef<THREE.Mesh>(null);
  const waveGroup = useRef<THREE.Group>(null);
  const waveMat = useRef<THREE.LineBasicMaterial>(null);
  const pulsesGeo = useRef<THREE.BufferGeometry>(null);

  const mobile = isMobileDevice();
  const DENSITY = mobile ? 0.55 : 1;
  const PULSES = mobile ? 70 : 150;
  const HALO = mobile ? 220 : 480;
  const PLATES = mobile ? 4 : 7;

  const bloomMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: bloomVertex,
        fragmentShader: bloomFragment,
        uniforms: { uIntensity: { value: 1 } },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const data = useMemo(() => {
    const core = buildCore();
    const bandABuilder = buildBand(0.38, 0.84, Math.round(13 * DENSITY) + 5, DENSITY, 0.08);
    const bandB = buildBand(0.86, 1.14, Math.round(11 * DENSITY) + 4, DENSITY, 0.12);
    const bandC = buildBand(1.16, R, Math.round(8 * DENSITY) + 3, DENSITY * 0.8, 0.16, true);
    const spokes = buildSpokes(mobile ? 9 : 14, mobile ? 16 : 34);
    const tilt = buildTiltRings();
    const plates = [buildPlates(PLATES), buildPlates(PLATES), buildPlates(PLATES)];

    // one or two bright feature panels near the core (reference detail)
    {
      const pb = new LayerBuilder();
      pb.panel(0.06, 0.42, 0.02, 0.055, 0.13, Math.PI / 2 + 0.08, 1.1);
      pb.panel(-0.38, -0.2, -0.02, 0.045, 0.09, -0.5, 0.85);
      const fp = pb.build();
      // merge into band A so they rotate with the inner circuitry
      const mergeF32 = (a: Float32Array, b: Float32Array) => {
        const out = new Float32Array(a.length + b.length);
        out.set(a); out.set(b, a.length);
        return out;
      };
      bandABuilder.line = mergeF32(bandABuilder.line, fp.line);
      bandABuilder.lineCol = mergeF32(bandABuilder.lineCol, fp.lineCol);
      bandABuilder.fill = mergeF32(bandABuilder.fill, fp.fill);
      bandABuilder.fillCol = mergeF32(bandABuilder.fillCol, fp.fillCol);
      bandABuilder.nodePos = mergeF32(bandABuilder.nodePos, fp.nodePos);
      bandABuilder.nodeCol = mergeF32(bandABuilder.nodeCol, fp.nodeCol);
      bandABuilder.nodeSize = mergeF32(bandABuilder.nodeSize, fp.nodeSize);
      bandABuilder.nodeBright = mergeF32(bandABuilder.nodeBright, fp.nodeBright);
    }
    const bandA = bandABuilder;

    // layered core bloom: white-hot center -> gold -> orange halo
    const bloomPos = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const bloomSize = new Float32Array([1.3, 2.6, 4.6]);
    const bloomCol = new Float32Array(9);
    const tmp = new THREE.Color();
    [["#ffffff", 1.15], ["#ffd98a", 0.6], ["#ff7f1e", 0.28]].forEach(([hex, mul], i) => {
      tmp.set(hex as string).multiplyScalar(mul as number);
      bloomCol.set([tmp.r, tmp.g, tmp.b], i * 3);
    });

    // dim orbiting particle halo (flattened shell, inside R)
    const haloPos = new Float32Array(HALO * 3);
    const haloCol = new Float32Array(HALO * 3);
    const haloSize = new Float32Array(HALO);
    const haloBright = new Float32Array(HALO);
    for (let i = 0; i < HALO; i++) {
      const th = Math.random() * Math.PI * 2;
      const rad = 0.5 + Math.pow(Math.random(), 0.7) * (R - 0.52);
      const zz = (Math.random() - 0.5) * 2 * Math.sqrt(Math.max(0, R * R - rad * rad)) * 0.55;
      haloPos.set([Math.cos(th) * rad, Math.sin(th) * rad, zz], i * 3);
      radialColor(rad, tmp);
      haloCol.set([tmp.r, tmp.g, tmp.b], i * 3);
      haloSize[i] = 0.07 + Math.random() * 0.12;
      haloBright[i] = 0.22 + Math.random() * 0.35;
    }

    // energy pulses: dots flowing around ring paths at many radii
    const pulseR = new Float32Array(PULSES);
    const pulseZ = new Float32Array(PULSES);
    const pulseSpeed = new Float32Array(PULSES);
    const pulsePhase = new Float32Array(PULSES);
    const pulseCol = new Float32Array(PULSES * 3);
    const pulseSize = new Float32Array(PULSES);
    const PCOLS = ["#ffe08a", "#ffffff", "#ff9a3c"];
    for (let i = 0; i < PULSES; i++) {
      pulseR[i] = 0.18 + Math.random() * (R - 0.2);
      pulseZ[i] = (Math.random() - 0.5) * 0.14;
      pulseSpeed[i] = (Math.random() < 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.55) / Math.max(0.35, pulseR[i]);
      pulsePhase[i] = Math.random() * Math.PI * 2;
      tmp.set(PCOLS[Math.floor(Math.random() * PCOLS.length)]);
      pulseCol.set([tmp.r, tmp.g, tmp.b], i * 3);
      pulseSize[i] = 0.2 + Math.random() * 0.16;
    }

    // expanding wave ring (unit circle, scaled at runtime)
    const wave: number[] = [];
    const wsegs = 110;
    for (let i = 0; i < wsegs; i++) {
      const a = (i / wsegs) * Math.PI * 2;
      const b2 = ((i + 1) / wsegs) * Math.PI * 2;
      wave.push(Math.cos(a), Math.sin(a), 0, Math.cos(b2), Math.sin(b2), 0);
    }

    return {
      core, bandA, bandB, bandC, spokes, tilt, plates,
      bloomPos, bloomSize, bloomCol,
      haloPos, haloCol, haloSize, haloBright,
      pulseR, pulseZ, pulseSpeed, pulsePhase, pulseCol, pulseSize,
      wavePos: new Float32Array(wave),
    };
  }, [DENSITY, PULSES, HALO, PLATES, mobile]);

  const pulsePosBuf = useMemo(() => new Float32Array(PULSES * 3), [PULSES]);
  const pulseBrightBuf = useMemo(() => new Float32Array(PULSES), [PULSES]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const scroll = typeof window !== "undefined" ? window.scrollY : 0;

    // whole hologram: gentle presentation tilt + slow sway (never edge-on)
    if (assembly.current) {
      assembly.current.rotation.x = -0.16 + Math.sin(t * 0.17) * 0.05;
      assembly.current.rotation.y = Math.sin(t * 0.11) * 0.24 + scroll * 0.0012;
    }

    // every band rotates in-plane at its own speed/direction
    if (coreGrp.current) coreGrp.current.rotation.z = t * 0.85;
    if (grpA.current) grpA.current.rotation.z = -t * 0.3;
    if (grpB.current) grpB.current.rotation.z = t * 0.16;
    if (grpC.current) grpC.current.rotation.z = -t * 0.07;
    if (spokesGrp.current) spokesGrp.current.rotation.z = t * 0.045;
    if (tiltGrp.current) {
      tiltGrp.current.rotation.z = t * 0.1;
      tiltGrp.current.rotation.x = Math.sin(t * 0.23) * 0.1;
    }
    if (haloGrp.current) haloGrp.current.rotation.z = t * 0.05;
    plateGrps.forEach((g, i) => {
      if (!g.current) return;
      g.current.rotation.z = t * 0.04 * (i % 2 === 0 ? 1 : -1);
      g.current.position.y = Math.sin(t * 0.5 + i * 2.1) * 0.03;
    });

    // nucleus pulse
    const pulse = 0.95 + 0.25 * Math.sin(t * 2.2);
    bloomMat.uniforms.uIntensity.value = pulse;
    if (coreMesh.current) coreMesh.current.scale.setScalar(1 + 0.12 * Math.sin(t * 2.2));

    // expanding energy wave (repeats every 5s)
    if (waveGroup.current && waveMat.current) {
      const ph = (t % 5) / 5;
      const sc = 0.3 + ph * (R - 0.28);
      waveGroup.current.scale.set(sc, sc, 1);
      waveMat.current.opacity = (1 - ph) * 0.4;
    }

    // pulses orbiting the rings
    const { pulseR, pulseZ, pulseSpeed, pulsePhase } = data;
    for (let i = 0; i < PULSES; i++) {
      const a = pulsePhase[i] + t * pulseSpeed[i];
      const o = i * 3;
      pulsePosBuf[o] = Math.cos(a) * pulseR[i];
      pulsePosBuf[o + 1] = Math.sin(a) * pulseR[i];
      pulsePosBuf[o + 2] = pulseZ[i];
      pulseBrightBuf[i] = 0.55 + 0.45 * Math.sin(a * 3 + i);
    }
    if (pulsesGeo.current) {
      pulsesGeo.current.attributes.position.needsUpdate = true;
      pulsesGeo.current.attributes.aBright.needsUpdate = true;
    }
  });

  return (
    <group ref={assembly}>
      {/* nucleus: layered bloom + white-hot sphere + tight rings + burst */}
      <group ref={coreGrp} renderOrder={6}>
        <points renderOrder={6}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.bloomPos, 3]} />
            <bufferAttribute attach="attributes-aSize" args={[data.bloomSize, 1]} />
            <bufferAttribute attach="attributes-aColor" args={[data.bloomCol, 3]} />
          </bufferGeometry>
          <primitive object={bloomMat} attach="material" />
        </points>
        <mesh ref={coreMesh} renderOrder={7}>
          <sphereGeometry args={[0.15, 24, 24]} />
          <meshBasicMaterial color="#fffaf0" transparent depthTest={false} />
        </mesh>
        <LayerLines data={data.core} />
        <LayerNodes data={data.core} />
      </group>

      {/* circuitry bands (A holds the feature panels) */}
      <Layer data={data.bandA} groupRef={grpA} renderOrder={4} opacity={0.85} />
      <Layer data={data.bandB} groupRef={grpB} renderOrder={3} opacity={0.72} />
      <Layer data={data.bandC} groupRef={grpC} renderOrder={2} opacity={0.6} />

      {/* dashed radial data highways */}
      <group ref={spokesGrp} renderOrder={3}>
        <LayerLines data={data.spokes} opacity={0.7} />
        <LayerNodes data={data.spokes} />
      </group>

      {/* shallow tilted volume rings */}
      <group ref={tiltGrp} renderOrder={2}>
        <LayerLines data={data.tilt} opacity={0.5} />
      </group>

      {/* small floating holographic plates */}
      {data.plates.map((p, i) => (
        <Layer key={i} data={p} groupRef={plateGrps[i]} renderOrder={5} opacity={0.7} />
      ))}

      {/* dim orbiting particle halo */}
      <group ref={haloGrp} renderOrder={1}>
        <points frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.haloPos, 3]} />
            <bufferAttribute attach="attributes-aColor" args={[data.haloCol, 3]} />
            <bufferAttribute attach="attributes-aBright" args={[data.haloBright, 1]} />
            <bufferAttribute attach="attributes-aSize" args={[data.haloSize, 1]} />
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
      </group>

      {/* energy pulses flowing along the rings */}
      <points renderOrder={5} frustumCulled={false}>
        <bufferGeometry ref={pulsesGeo}>
          <bufferAttribute attach="attributes-position" args={[pulsePosBuf, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[data.pulseCol, 3]} />
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

      {/* repeating expanding wave */}
      <group ref={waveGroup} renderOrder={1}>
        <lineSegments frustumCulled={false}>
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
