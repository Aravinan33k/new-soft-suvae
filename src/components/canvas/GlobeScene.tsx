"use client";

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import GlobeFallback from "@/components/dom/GlobeFallback";

// Photoreal cinematic Earth for the hero — live 3D, continuously rotating.
//
//  - Real NASA-derived textures (public domain, served from /public):
//    day albedo + night city lights, blended by a directional "sun" so
//    the visible hemisphere shows golden city clusters with a lit
//    crescent at the terminator (Black-Marble look).
//  - Warm atmosphere rim + soft volumetric back-glow.
//  - An external network cage: great-circle arcs between REAL cities bow
//    well outside the surface (Chennai HQ glows brightest) with traveling
//    data pulses and breathing city nodes.
//  - Two faint orbital rings and a handful of tiny drifting sparks —
//    restrained, so the Earth itself carries the scene.
//
//  Motion: one full Y rotation every 120s, a slow 102%→100% breathing
//  zoom every 8s, a soft light band sweeping pole-to-pole, city nodes
//  occasionally flashing orange→white→orange at random, gentle mouse
//  parallax (no drag/zoom), rendering pauses off-viewport,
//  prefers-reduced-motion gets a static frame.

const isMobileDevice = () =>
  typeof window !== "undefined" && window.innerWidth < 768;

// Deterministic PRNG (mulberry32) — geometry randomness must be pure so
// React re-renders can't reshuffle the scene, and every visitor sees the
// same composition.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const R = 1.24; // globe radius (+8% per the premium-scale pass — the Earth should command the hero)
const SPIN = (Math.PI * 2) / 120; // one revolution every 120s

// lat/lon (degrees) → unit vector matching three.js SphereGeometry UVs
function latLonToVec3(lat: number, lon: number, r = 1): THREE.Vector3 {
  const polar = THREE.MathUtils.degToRad(90 - lat);
  const a = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -Math.cos(a) * Math.sin(polar),
    Math.cos(polar),
    Math.sin(a) * Math.sin(polar),
  ).multiplyScalar(r);
}

// Glowing lat/long wireframe (the "cage") sitting just off the surface —
// meridians + parallels as line segments. Sits at r slightly > R so the
// front reads as a wireframe hugging the globe while the globe's depth
// occludes the back half.
function buildGraticule(radius: number): Float32Array {
  const pos: number[] = [];
  const STEP = 4; // degrees between sampled points along each line
  const push = (v: THREE.Vector3, p: THREE.Vector3 | null) => {
    if (p) pos.push(p.x, p.y, p.z, v.x, v.y, v.z);
  };
  // meridians every 15°
  for (let lon = -180; lon < 180; lon += 15) {
    let prev: THREE.Vector3 | null = null;
    for (let lat = -90; lat <= 90; lat += STEP) {
      const v = latLonToVec3(lat, lon, radius);
      push(v, prev);
      prev = v;
    }
  }
  // parallels every 15°
  for (let lat = -75; lat <= 75; lat += 15) {
    let prev: THREE.Vector3 | null = null;
    for (let lon = -180; lon <= 180; lon += STEP) {
      const v = latLonToVec3(lat, lon, radius);
      push(v, prev);
      prev = v;
    }
  }
  return new Float32Array(pos);
}

// Real network cities — index 0 is Soft Suave HQ (Chennai), the single hub
// every arc converges on. The rest are the world's leading tech hubs; each
// one throws a great-circle "vein" straight into Chennai.
const CITIES: [number, number][] = [
  [13.08, 80.27], // Chennai (HQ) — every arc converges here
  [37.77, -122.42], // San Francisco Bay Area, USA
  [40.71, -74.01], // New York City, USA
  [39.9, 116.4], // Beijing, China
  [47.61, -122.33], // Seattle, USA
  [30.27, -97.74], // Austin, USA
  [51.51, -0.13], // London, UK
  [34.05, -118.24], // Los Angeles, USA
  [42.36, -71.06], // Boston, USA
  [31.23, 121.47], // Shanghai, China
  [22.54, 114.06], // Shenzhen, China
  [12.97, 77.59], // Bengaluru, India
  [1.35, 103.82], // Singapore
  [30.27, 120.15], // Hangzhou, China
  [48.86, 2.35], // Paris, France
  [43.65, -79.38], // Toronto, Canada
  [37.57, 126.98], // Seoul, South Korea
  [32.08, 34.78], // Tel Aviv, Israel
  [35.68, 139.69], // Tokyo, Japan
  [52.52, 13.4], // Berlin, Germany
  [38.91, -77.04], // Washington, D.C., USA
  [-23.55, -46.63], // São Paulo, Brazil
  [19.07, 72.88], // Mumbai, India
  [41.88, -87.63], // Chicago, USA
  [28.61, 77.21], // New Delhi, India
  [32.78, -96.8], // Dallas, USA
  [32.72, -117.16], // San Diego, USA
  [52.37, 4.9], // Amsterdam, Netherlands
];
// Hub-and-spoke: every tech hub links straight to Chennai (index 0)…
const SPOKES: [number, number][] = CITIES.slice(1).map(
  (_, i) => [0, i + 1] as [number, number],
);
// …PLUS a regional mesh between the hubs themselves, so veins wrap the whole
// planet — whichever hemisphere faces the camera has arcs flowing across it,
// instead of every line bunching out of the Chennai side. Indices reference
// the CITIES list above.
const MESH: [number, number][] = [
  // Americas
  [1, 2], // San Francisco – New York
  [1, 4], // San Francisco – Seattle
  [2, 15], // New York – Toronto
  [7, 25], // Los Angeles – Dallas
  [23, 20], // Chicago – Washington, D.C.
  [21, 2], // São Paulo – New York
  [26, 5], // San Diego – Austin
  // transatlantic + Europe
  [2, 6], // New York – London
  [6, 14], // London – Paris
  [19, 27], // Berlin – Amsterdam
  [14, 17], // Paris – Tel Aviv
  // Asia + transpacific
  [18, 16], // Tokyo – Seoul
  [9, 3], // Shanghai – Beijing
  [10, 12], // Shenzhen – Singapore
  [22, 24], // Mumbai – New Delhi
  [18, 4], // Tokyo – Seattle
];
const LINKS: [number, number][] = [...SPOKES, ...MESH];

// ---------------------------------------------------------------------
// Shaders

// Earth surface: day albedo vs night city lights, split by a fixed sun
// direction (world space) so the terminator stays put while the planet
// rotates beneath it — plus a warm fresnel rim.
const earthVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNw;
  varying vec3 vNv;
  void main() {
    vUv = uv;
    vNw = normalize(mat3(modelMatrix) * normal);
    vNv = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const earthFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying vec3 vNw;
  varying vec3 vNv;
  // Deliberately minimal: NASA photography + ONE directional light + a thin
  // atmospheric edge. Every removed effect (scan bands, glare stacks, tone
  // remaps, heavy tints) is what made the globe read "painted" — the
  // satellite imagery carries the realism, the shader stays out of its way.
  void main() {
    float sun = dot(normalize(vNw), normalize(uSunDir));

    // --- Stage 1+2: textures lit by a single directional light -----------
    vec3 albedo = texture2D(uDay, vUv).rgb;
    // land vs ocean from the day map (land is red-dominant, ocean blue)
    float land = smoothstep(0.03, 0.16, albedo.r - albedo.b);

    // Night side: real space ocean is ~25-35% brightness, essentially black
    // with a breath of navy. This floor is what makes every city light pop.
    vec3 nightBase = mix(vec3(0.010, 0.020, 0.036), vec3(0.028, 0.040, 0.052), land);

    // Day side: land stays photographic (no wash so Sahara keeps its dunes
    // and shadows); oceans pulled hard toward near-black navy — royal-blue
    // water is the one thing that fights the warm palette.
    vec3 dayLand = albedo * vec3(1.0, 0.97, 0.92);
    vec3 dayOcean = albedo * vec3(0.10, 0.15, 0.22);
    vec3 dayCol = mix(dayOcean, dayLand, land);

    // soft terminator, no artificial narrowing
    float dayMix = smoothstep(-0.05, 0.3, sun);
    float daylight = clamp(sun, 0.0, 1.0);
    vec3 base = mix(nightBase, dayCol * (0.15 + 0.85 * daylight), dayMix);

    // City lights: linear gain only, so the texture's own dynamic range
    // decides — Tokyo blazes, a country town stays one crisp dot. The
    // warm-white term uses a STEEP curve (pow 6) so only the very hottest
    // downtown cores whiten; Europe reads as separate clusters (Italy,
    // France, UK), never one merged white mass.
    vec3 nl = texture2D(uNight, vUv).rgb;
    float lum = dot(nl, vec3(0.299, 0.587, 0.114));
    vec3 city = nl * vec3(1.0, 0.78, 0.416) * 1.45;
    city += vec3(1.0, 0.969, 0.902) * pow(lum, 6.0) * 0.7;
    base += city * (1.0 - dayMix);

    // Tight sun glint on water only — tiny, PBR-style, not a wash
    float glint = pow(daylight, 24.0) * (1.0 - land);
    base += vec3(1.0, 0.85, 0.65) * glint * 0.18;

    // --- Stage 4: atmosphere as a thin EDGE effect, not a halo ------------
    float fres = pow(1.0 - abs(dot(normalize(vNv), vec3(0.0, 0.0, 1.0))), 5.0);
    float limbLit = smoothstep(-0.1, 0.55, sun);
    // sunrise edge on the lit limb: gold #FFD17A at the base of the glow
    // rolling to orange #FF9A42 right at the rim — the CTA gradient
    vec3 sunriseCol = mix(vec3(1.0, 0.82, 0.478), vec3(1.0, 0.604, 0.259), fres);
    base += sunriseCol * fres * limbLit * 0.3;
    // near-invisible warm air-line on the dark limb keeps the silhouette
    // (spec atmosphere rgba(255,190,90) — no blue anywhere on the rim)
    base += vec3(1.0, 0.745, 0.353) * fres * (1.0 - limbLit) * 0.05;

    gl_FragColor = vec4(base, 1.0);
  }
`;

// Real NASA cloud layer on its own sphere — the texture carries hurricanes,
// fronts and streaks no noise function can fake. Nearly invisible over deep
// night, warm-lit near the sunrise crescent, faded at the limb so it never
// muddies the rim line. Cool grey on the dark side gives the warm palette
// something to contrast against.
const cloudVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNw;
  varying vec3 vNv;
  void main() {
    vUv = uv;
    vNw = normalize(mat3(modelMatrix) * normal);
    vNv = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const cloudFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uClouds;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying vec3 vNw;
  varying vec3 vNv;
  void main() {
    float c = texture2D(uClouds, vUv).r;
    float sun = dot(normalize(vNw), normalize(uSunDir));
    float lit = 0.03 + 0.8 * smoothstep(0.0, 0.7, sun);
    // neutral warm-grey on the night side (no blue cast), sunrise-gold when lit
    vec3 col = mix(vec3(0.56, 0.53, 0.50), vec3(1.0, 0.78, 0.52), smoothstep(0.05, 0.6, sun));
    // high threshold: only genuinely thick weather (fronts, hurricanes)
    // survives — thin haze goes fully transparent so it never reads as a
    // milky film painted on the surface
    float alpha = smoothstep(0.32, 0.9, c) * lit * 0.3;
    // fade at the limb so the silhouette edge stays crisp
    float edge = abs(dot(normalize(vNv), vec3(0.0, 0.0, 1.0)));
    alpha *= smoothstep(0.06, 0.35, edge);
    gl_FragColor = vec4(col, alpha);
  }
`;

// City hubs + traveling pulses + ring/ambient sparks: additive glow.
// Alpha follows intensity so sprites never punch opaque holes.
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
    gl_PointSize = clamp(aSize * (260.0 / -mv.z), 1.0, 24.0);
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
    float core = smoothstep(0.16, 0.0, d);
    float intensity = (soft * 0.55 + core * 0.95) * vBright;
    gl_FragColor = vec4(vColor, intensity);
  }
`;

const atmoVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vNw;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vNw = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Outer atmosphere halo — two-tone: cool cyan on the shadowed limb, warm
// orange toward the sun (back side, alpha follows intensity).
const atmoFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uSunDir;
  varying vec3 vNormal;
  varying vec3 vNw;
  void main() {
    // Real atmosphere is a fraction of Earth's radius — a tight rind, not a
    // second object. Steep falloff keeps it pixels-thin at the silhouette.
    float intensity = max(pow(0.58 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 5.0), 0.0);
    float sun = dot(normalize(vNw), normalize(uSunDir));
    // spec atmosphere: rgba(255,190,90,0.12) — one warm tone, slightly
    // stronger toward the sunrise, near-invisible on the shadow side
    vec3 col = vec3(1.0, 0.745, 0.353);
    float boost = 0.075 * (0.5 + 0.9 * smoothstep(0.0, 0.8, sun));
    gl_FragColor = vec4(col, intensity * boost);
  }
`;

// Volumetric back-glow plane
const volumeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const volumeFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float fall = smoothstep(1.0, 0.0, d);
    // volumetric sunrise back-glow — brand #FF9B42, barely there
    gl_FragColor = vec4(vec3(1.0, 0.608, 0.259), fall * fall * 0.04);
  }
`;

// ---------------------------------------------------------------------

const ARC_SEG = 36;
// spec palette: arc orange, city-core warm white, city-glow gold
const PULSE_COLORS = ["#FF9A3C", "#FFF7E6", "#FFC76A"];
const FLASH_DUR = 1.1; // seconds a hub node takes to flash orange -> white -> orange
// Sun sits behind the planet's upper-RIGHT shoulder, so the camera-facing
// hemisphere stays in night (golden city lights) with a hot sunrise crescent
// blooming along the RIGHT limb — the Black-Marble reference composition.
// z is strongly negative: the sun is almost directly BEHIND the planet, so
// the camera-facing hemisphere gets no daylight at all — only the upper-right
// limb catches the sunrise, exactly like the reference.
const SUN_DIR = new THREE.Vector3(0.42, 0.3, -0.86).normalize();

// Shared by Earth (rendering) and WarmUp (staggered GPU upload) — same URLs
// hit the same useLoader cache entries, so the textures load exactly once.
const TEXTURE_URLS = [
  "/textures/earth_day.jpg",
  "/textures/earth_lights.jpg",
  "/textures/earth_clouds.jpg",
];

function Earth({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const pulsesGeo = useRef<THREE.BufferGeometry>(null);
  const hubsGeo = useRef<THREE.BufferGeometry>(null);
  // Accumulated animation time — only advances while `animate` is true, so
  // the staged hero reveal (globe held still + hidden during the text's
  // entrance) starts every motion from zero with no visible jump.
  const tAcc = useRef(0);

  const [dayMap, nightMap, cloudMap] = useLoader(
    THREE.TextureLoader,
    TEXTURE_URLS,
  );
  useMemo(() => {
    for (const t of [dayMap, nightMap, cloudMap]) {
      t.anisotropy = 16;
      t.wrapS = THREE.RepeatWrapping;
    }
  }, [dayMap, nightMap, cloudMap]);

  const graticule = useMemo(() => buildGraticule(R * 1.012), []);

  const data = useMemo(() => {
    const hubs = CITIES.map(([lat, lon]) => latLonToVec3(lat, lon));

    // Arcs: slerp paths between cities, lifted above the surface
    const arcs: Float32Array[] = [];
    const linePos: number[] = [];
    const lineCol: number[] = [];
    // network arcs — spec Arc color #FF9A3C
    const lineColor = new THREE.Color("#FF9A3C");
    for (const [i, j] of LINKS) {
      const a = hubs[i];
      const b = hubs[j];
      const angle = a.angleTo(b);
      // Bow the arcs just off the surface so they wrap the globe like the
      // reference — thin orange great-circles hugging the planet. Kept low so
      // the veins ride close to the Earth rather than floating well above it.
      const lift = 0.02 + angle * 0.035;
      const pts = new Float32Array((ARC_SEG + 1) * 3);
      const tmp = new THREE.Vector3();
      for (let s = 0; s <= ARC_SEG; s++) {
        const t = s / ARC_SEG;
        const sinA = Math.sin(angle);
        if (sinA < 1e-5) tmp.copy(a);
        else
          tmp
            .copy(a)
            .multiplyScalar(Math.sin((1 - t) * angle) / sinA)
            .addScaledVector(b, Math.sin(t * angle) / sinA);
        tmp.normalize().multiplyScalar(R * (1 + lift * Math.sin(Math.PI * t)));
        pts.set([tmp.x, tmp.y, tmp.z], s * 3);
        if (s > 0) {
          linePos.push(
            pts[(s - 1) * 3], pts[(s - 1) * 3 + 1], pts[(s - 1) * 3 + 2],
            tmp.x, tmp.y, tmp.z,
          );
          const mid = Math.sin(Math.PI * ((t + (s - 1) / ARC_SEG) / 2));
          const br = 0.2 + 0.8 * mid;
          lineCol.push(
            lineColor.r * br, lineColor.g * br, lineColor.b * br,
            lineColor.r * br, lineColor.g * br, lineColor.b * br,
          );
        }
      }
      arcs.push(pts);
    }

    // One pulse per arc
    const rand = mulberry32(0x5eed);
    const pulseCount = arcs.length;
    const pulsePhase = new Float32Array(pulseCount);
    const pulseSpeed = new Float32Array(pulseCount);
    const pulseColor = new Float32Array(pulseCount * 3);
    const pulseSize = new Float32Array(pulseCount).fill(1.5);
    const tmpColor = new THREE.Color();
    for (let p = 0; p < pulseCount; p++) {
      pulsePhase[p] = rand();
      // slower drift along the veins — a calm ~5.5–8.5s per arc (was 2.4–4.2s)
      pulseSpeed[p] = 1 / (5.5 + rand() * 3);
      tmpColor.set(PULSE_COLORS[Math.floor(rand() * PULSE_COLORS.length)]);
      pulseColor.set([tmpColor.r, tmpColor.g, tmpColor.b], p * 3);
    }

    // Hub glow attributes — Chennai (index 0) biggest and gold
    const hubPos = new Float32Array(hubs.length * 3);
    const hubColor = new Float32Array(hubs.length * 3);
    const hubSize = new Float32Array(hubs.length);
    const hubPhase = new Float32Array(hubs.length);
    const hubFlashAt = new Float32Array(hubs.length);
    hubs.forEach((h, i) => {
      hubPos.set([h.x * R * 1.008, h.y * R * 1.008, h.z * R * 1.008], i * 3);
      // HQ = bright soft-white node, others = hot-spot gold or main-glow orange
      tmpColor.set(i === 0 ? "#FFF7E6" : rand() < 0.3 ? "#FFC76A" : "#FF9A3C");
      hubColor.set([tmpColor.r, tmpColor.g, tmpColor.b], i * 3);
      hubSize[i] = i === 0 ? 3.4 : 1.7 + rand() * 0.9;
      hubPhase[i] = rand() * 10;
      // staggered so nodes never flash in sync — each reschedules itself
      hubFlashAt[i] = 2 + rand() * 14;
    });

    return {
      arcs,
      linePos: new Float32Array(linePos),
      lineCol: new Float32Array(lineCol),
      pulsePhase, pulseSpeed, pulseColor, pulseSize,
      hubPos, hubColor, hubSize, hubPhase, hubFlashAt,
    };
  }, []);

  const pulseCount = data.arcs.length;
  // Stable per-frame buffers: created once, then mutated in place every frame
  // by the render loop (the standard r3f pattern — bufferAttribute holds these
  // exact arrays, so mutating their contents updates the GPU without churn).
  const pulsePosBuf = useMemo(() => new Float32Array(pulseCount * 3), [pulseCount]);
  const pulseBrightBuf = useMemo(() => new Float32Array(pulseCount), [pulseCount]);
  const hubBrightBuf = useMemo(
    () => new Float32Array(data.hubPos.length / 3).fill(1),
    [data.hubPos],
  );
  // mutable per-frame color (base orange/gold, occasionally lerped to white)
  const hubColorBuf = useMemo(() => data.hubColor.slice(), [data.hubColor]);
  // mutable next-flash schedule, copied out of the memoised `data`
  const hubFlashAtBuf = useMemo(() => data.hubFlashAt.slice(), [data.hubFlashAt]);

  const earthUniforms = useMemo(
    () => ({
      uDay: { value: dayMap },
      uNight: { value: nightMap },
      uSunDir: { value: SUN_DIR },
    }),
    [dayMap, nightMap],
  );
  const atmoUniforms = useMemo(() => ({ uSunDir: { value: SUN_DIR } }), []);
  const cloudUniforms = useMemo(
    () => ({ uClouds: { value: cloudMap }, uSunDir: { value: SUN_DIR } }),
    [cloudMap],
  );

  useFrame((_, delta) => {
    if (animate) tAcc.current += Math.min(delta, 0.1);
    const t = tAcc.current;
    if (group.current) {
      // frames Europe / Africa / Middle East / India toward the camera
      // (~35°E at centre, India to the right toward the sunrise limb) then
      // spins slowly — one revolution every 120s
      group.current.rotation.y = -2.2 + t * SPIN;
      group.current.rotation.x = -0.18;
      // gentle breathing zoom: 100% -> 102% -> 100% every 8s
      const zoom = 1 + 0.01 * (1 - Math.cos((t / 8) * Math.PI * 2));
      group.current.scale.setScalar(zoom);
    }
    // clouds drift slowly relative to the ground — weather, not paint
    if (cloudsRef.current) cloudsRef.current.rotation.y = t * 0.007;
    if (!animate) return;

    for (let p = 0; p < pulseCount; p++) {
      const prog = (t * data.pulseSpeed[p] + data.pulsePhase[p]) % 1;
      const arc = data.arcs[p];
      const f = prog * (ARC_SEG - 1);
      const s = Math.floor(f);
      const frac = f - s;
      const o = s * 3;
      const p3 = p * 3;
      pulsePosBuf[p3] = arc[o] + (arc[o + 3] - arc[o]) * frac;
      pulsePosBuf[p3 + 1] = arc[o + 1] + (arc[o + 4] - arc[o + 1]) * frac;
      pulsePosBuf[p3 + 2] = arc[o + 2] + (arc[o + 5] - arc[o + 2]) * frac;
      // dimmer pulses — softer, less saturated glow along the veins
      pulseBrightBuf[p] = Math.sin(prog * Math.PI) * 0.5;
    }
    if (pulsesGeo.current) {
      pulsesGeo.current.attributes.position.needsUpdate = true;
      pulsesGeo.current.attributes.aBright.needsUpdate = true;
    }

    for (let h = 0; h < hubBrightBuf.length; h++) {
      hubBrightBuf[h] =
        (h === 0 ? 0.85 : 0.55) +
        0.45 * Math.abs(Math.sin(t * 0.9 + data.hubPhase[h]));

      // occasional random flash: base color -> white -> base color
      let flash = 0;
      const flashAt = hubFlashAtBuf[h];
      if (t >= flashAt && t < flashAt + FLASH_DUR) {
        flash = Math.sin(((t - flashAt) / FLASH_DUR) * Math.PI);
      } else if (t >= flashAt + FLASH_DUR) {
        hubFlashAtBuf[h] = t + 5 + Math.random() * 16;
      }
      const b = h * 3;
      hubColorBuf[b] = data.hubColor[b] + (1 - data.hubColor[b]) * flash;
      hubColorBuf[b + 1] = data.hubColor[b + 1] + (1 - data.hubColor[b + 1]) * flash;
      hubColorBuf[b + 2] = data.hubColor[b + 2] + (1 - data.hubColor[b + 2]) * flash;
    }
    if (hubsGeo.current) {
      hubsGeo.current.attributes.aBright.needsUpdate = true;
      hubsGeo.current.attributes.aColor.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      {/* the planet itself — day/night textured, sun-lit */}
      <mesh renderOrder={0}>
        <sphereGeometry args={[R, 96, 96]} />
        <shaderMaterial
          vertexShader={earthVertex}
          fragmentShader={earthFragment}
          uniforms={earthUniforms}
        />
      </mesh>

      {/* real NASA cloud layer on its own sphere, drifting independently */}
      <mesh ref={cloudsRef} renderOrder={1} scale={1.006}>
        <sphereGeometry args={[R, 64, 64]} />
        <shaderMaterial
          vertexShader={cloudVertex}
          fragmentShader={cloudFragment}
          uniforms={cloudUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* atmosphere halo — barely past the surface; a rind, not a ring */}
      <mesh renderOrder={0} scale={1.028}>
        <sphereGeometry args={[R, 48, 48]} />
        <shaderMaterial
          vertexShader={atmoVertex}
          fragmentShader={atmoFragment}
          uniforms={atmoUniforms}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* lat/long graticule hidden — the reference has no wireframe grid on
          the globe; the external network arcs carry the structure instead.
          (opacity 0 keeps the geometry ready to re-enable if wanted.) */}
      <lineSegments renderOrder={1} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[graticule, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#FF8A2B"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* the CURVED connecting arcs — hub-and-spoke into Chennai plus the
          regional mesh between hubs — with their traveling pulses. These are
          the one line element kept on the planet (the straight overlay
          line-work lives in HeroServiceNetwork and stays removed). */}
      <lineSegments renderOrder={2}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.linePos, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.lineCol, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.28}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      <points renderOrder={3}>
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
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* breathing city nodes */}
      <points renderOrder={3}>
        <bufferGeometry ref={hubsGeo}>
          <bufferAttribute attach="attributes-position" args={[data.hubPos, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[hubColorBuf, 3]} />
          <bufferAttribute attach="attributes-aBright" args={[hubBrightBuf, 1]} />
          <bufferAttribute attach="attributes-aSize" args={[data.hubSize, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={glowVertex}
          fragmentShader={glowFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// Two faint orbital rings with a few small lights — radii tucked inside the
// camera frustum (was 1.2 / 1.32×R, whose edges crossed the square canvas
// boundary and clipped into straight lines, framing the Earth in a "box")
const RING_DEFS = [
  { r: R * 1.1, tiltX: 1.18, tiltZ: 0.22, speed: 0.12, particles: 7, opacity: 0.26 },
  { r: R * 1.18, tiltX: 1.42, tiltZ: -0.12, speed: -0.07, particles: 9, opacity: 0.18 },
];

function OrbitalRing({
  def,
  animate,
}: {
  def: (typeof RING_DEFS)[number];
  animate: boolean;
}) {
  const spin = useRef<THREE.Group>(null);

  const geo = useMemo(() => {
    const SEGS = 128;
    const circle = new Float32Array(SEGS * 3);
    for (let i = 0; i < SEGS; i++) {
      const a = (i / SEGS) * Math.PI * 2;
      circle.set([Math.cos(a) * def.r, Math.sin(a) * def.r, 0], i * 3);
    }
    const rand = mulberry32(0xa11 + def.particles);
    const n = def.particles;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const brightArr = new Float32Array(n);
    const tmp = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand() * 0.3;
      pos.set([Math.cos(a) * def.r, Math.sin(a) * def.r, 0], i * 3);
      const comet = i === 0;
      tmp.set(comet ? "#FFF7E6" : "#FFC76A"); // bright node / gold particle
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
      size[i] = comet ? 1.6 : 0.4 + rand() * 0.4;
      brightArr[i] = comet ? 1.3 : 0.6 + rand() * 0.4;
    }
    return { circle, pos, col, size, brightArr };
  }, [def]);

  useFrame((_, delta) => {
    if (animate && spin.current) spin.current.rotation.z += def.speed * delta;
  });

  return (
    <group rotation={[def.tiltX, 0, def.tiltZ]}>
      <group ref={spin}>
        <lineLoop renderOrder={2}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[geo.circle, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color="#FFC76A"
            transparent
            opacity={def.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineLoop>
        <points renderOrder={3}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[geo.pos, 3]} />
            <bufferAttribute attach="attributes-aColor" args={[geo.col, 3]} />
            <bufferAttribute attach="attributes-aBright" args={[geo.brightArr, 1]} />
            <bufferAttribute attach="attributes-aSize" args={[geo.size, 1]} />
          </bufferGeometry>
          <shaderMaterial
            vertexShader={glowVertex}
            fragmentShader={glowFragment}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    </group>
  );
}

// A handful of tiny drifting sparks — restrained
function FloatingSparks({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mobile = isMobileDevice();
  const N = mobile ? 18 : 34;

  const geo = useMemo(() => {
    const rand = mulberry32(0x50a7 + N);
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const size = new Float32Array(N);
    const brightArr = new Float32Array(N);
    const tmp = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const th = rand() * Math.PI * 2;
      // kept inside the ring radii so no spark drifts past the canvas edge
      const rad = R * (1.06 + rand() * 0.1);
      const y = (rand() - 0.5) * R * 1.7;
      pos.set([Math.cos(th) * rad, y, Math.sin(th) * rad], i * 3);
      tmp.set(rand() < 0.25 ? "#FF9A3C" : "#FFC76A"); // arc orange / glow gold
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
      size[i] = 0.08 + rand() * 0.16;
      brightArr[i] = 0.2 + rand() * 0.28;
    }
    return { pos, col, size, brightArr };
  }, [N]);

  useFrame((_, delta) => {
    if (animate && group.current) group.current.rotation.y += 0.01 * delta;
  });

  return (
    <group ref={group}>
      <points renderOrder={1} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[geo.pos, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[geo.col, 3]} />
          <bufferAttribute attach="attributes-aBright" args={[geo.brightArr, 1]} />
          <bufferAttribute attach="attributes-aSize" args={[geo.size, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={glowVertex}
          fragmentShader={glowFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// Gentle mouse parallax on the whole scene (no drag, no zoom)
function ParallaxRig({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) {
  const rig = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled]);

  useFrame((_, delta) => {
    if (!rig.current) return;
    const k = 1 - Math.exp(-delta * 3);
    rig.current.rotation.y += (target.current.x * 0.06 - rig.current.rotation.y) * k;
    rig.current.rotation.x += (target.current.y * 0.04 - rig.current.rotation.x) * k;
  });

  return <group ref={rig}>{children}</group>;
}

// Cinematic camera: a very slow dolly-in on load, then an almost
// imperceptible perpetual drift + look-at that reads as a tiny rotation
// (Apple-keynote calm). Layers over the mouse parallax on the scene group.
const CAM_BASE_Z = 3.8;
const CAM_START_EXTRA = 0.55; // how far back the dolly begins
const CAM_DOLLY_SECS = 2.8;

function CameraDolly({ enabled }: { enabled: boolean }) {
  const camera = useThree((s) => s.camera);
  const t0 = useRef<number | null>(null);
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (t0.current === null) t0.current = t;
    const e = t - t0.current;

    // ease-out cubic dolly from CAM_BASE_Z + extra -> CAM_BASE_Z
    const p = enabled ? Math.min(e / CAM_DOLLY_SECS, 1) : 1;
    const ease = 1 - Math.pow(1 - p, 3);
    const z = CAM_BASE_Z + CAM_START_EXTRA * (1 - ease);

    // tiny perpetual drift once settled (near-zero during the dolly)
    const driftX = enabled ? Math.sin(t * 0.11) * 0.05 : 0;
    const driftY = enabled ? Math.cos(t * 0.08) * 0.035 : 0;

    camera.position.set(driftX, 0.1 + driftY, z);
    camera.lookAt(target);
  });

  return null;
}

// User rotation: click-drag adds yaw/pitch, page scroll adds yaw. Layers on
// top of the slow idle spin and eases toward the target so it feels weighty.
function GlobeControls({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) {
  const grp = useRef<THREE.Group>(null);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const s = useRef({
    yaw: 0,
    pitch: 0,
    tYaw: 0,
    tPitch: 0,
    scrollYaw: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
  });

  useEffect(() => {
    if (!enabled) return;
    const el = gl.domElement;
    const st = s.current;

    const onDown = (e: PointerEvent) => {
      st.dragging = true;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      el.setPointerCapture?.(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!st.dragging) return;
      st.tYaw += (e.clientX - st.lastX) * 0.006;
      st.tPitch += (e.clientY - st.lastY) * 0.006;
      st.tPitch = Math.max(-0.6, Math.min(0.6, st.tPitch)); // clamp tilt
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      invalidate();
    };
    const onUp = (e: PointerEvent) => {
      st.dragging = false;
      try {
        el.releasePointerCapture?.(e.pointerId);
      } catch {
        /* pointer already released */
      }
      el.style.cursor = "grab";
    };
    const onScroll = () => {
      st.scrollYaw = window.scrollY * 0.0025;
      invalidate();
    };

    el.style.cursor = "grab";
    el.style.touchAction = "pan-y"; // let vertical page scroll through on touch
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", onScroll);
      el.style.cursor = "";
    };
  }, [gl, invalidate, enabled]);

  useFrame(() => {
    const st = s.current;
    const targetYaw = st.tYaw + st.scrollYaw;
    st.yaw += (targetYaw - st.yaw) * 0.12;
    st.pitch += (st.tPitch - st.pitch) * 0.12;
    if (grp.current) {
      grp.current.rotation.y = st.yaw;
      grp.current.rotation.x = st.pitch;
    }
  });

  return <group ref={grp}>{children}</group>;
}

// Subscribes to the reduced-motion media query via useSyncExternalStore —
// the idiomatic way to read an external store, with no synchronous setState
// inside an effect. Server snapshot is `false` (motion on) to match the
// pre-hydration default.
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

// Mounts only once the surrounding <Suspense> boundary resolves — i.e. the
// Earth's NASA textures have loaded and decoded — then spreads the remaining
// one-time GPU cost across invisible warm-up frames before reporting ready:
//   frames 0..2  upload ONE texture per frame (three ~2.5MB JPEGs in a single
//                frame is exactly the stall that used to land on the reveal)
//   frame  3     onVisible() — the scene renders next frame, paying its
//                shader-compile cost while the canvas is still at opacity 0
//   frame  5     onReady() — everything is compiled, uploaded and settled,
//                so the fade-in starts on a clean frame instead of a hitch.
function WarmUp({
  onVisible,
  onReady,
}: {
  onVisible: () => void;
  onReady: () => void;
}) {
  const maps = useLoader(THREE.TextureLoader, TEXTURE_URLS);
  const frame = useRef(0);
  useFrame(({ gl }) => {
    const f = frame.current;
    if (f > maps.length + 2) return;
    frame.current = f + 1;
    if (f < maps.length) gl.initTexture(maps[f]);
    else if (f === maps.length) onVisible();
    else if (f === maps.length + 2) onReady();
  });
  return null;
}

// Catches a hard failure inside the Canvas subtree — most importantly a WebGL
// context that can't be created at all (per-process cap reached) — and swaps in
// the static fallback instead of letting the error blank the hero.
class GLErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function GlobeScene({
  onRevealed,
}: {
  // fired once, the moment the staged entrance begins — HeroGlobe uses it to
  // cross-fade its static placeholder planet out under the live globe
  onRevealed?: () => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  // true once the GL context is lost and the browser hasn't handed it back
  // within a short grace window — flips the live canvas out for the fallback.
  const [glDown, setGlDown] = useState(false);
  // STAGED HERO REVEAL — the canvas mounts (already idle-delayed by
  // HeroGlobe) but stays invisible while the hero text animates in
  // (min-delay) AND the textures/shaders finish initializing (texReady).
  // WarmUp holds the scene hidden and spends a few opacity-0 frames on
  // texture upload + shader compile, then the globe fades in with its camera
  // dolly as the entrance move — so the hero never shows a stuttering
  // half-loaded planet competing with the text.
  const [texReady, setTexReady] = useState(false);
  // scene stays out of the render list until its textures are on the GPU, so
  // the shader-compile frame is as small as possible
  const [sceneVisible, setSceneVisible] = useState(false);
  const [minDelayDone, setMinDelayDone] = useState(false);
  const reduced = usePrefersReducedMotion();
  const lostTimer = useRef<number | null>(null);

  useEffect(() => {
    // text runs ~0.05–0.55s; the globe enters just after it settles
    const t = window.setTimeout(() => setMinDelayDone(true), 750);
    return () => window.clearTimeout(t);
  }, []);
  const onTexturesReady = useCallback(() => setTexReady(true), []);
  const onSceneVisible = useCallback(() => setSceneVisible(true), []);
  // Reduced motion only skips the artificial hero-choreography pause
  // (minDelay) — it must NOT skip waiting for the real NASA textures to
  // finish loading (texReady). The previous `reduced || (texReady && ...)`
  // let reduced-motion clients (and slow/remote connections — devtunnels,
  // throttled networks — commonly report reduced motion) flip `revealed`
  // true the instant the component mounted, well before the ~7.5MB of
  // texture JPEGs had actually downloaded. That fired onRevealed() early,
  // starting the fallback's 1s CSS fade-out with nothing finished loading
  // underneath it yet — the flat, textureless placeholder sphere caught
  // mid-fade with no real globe to replace it.
  const revealed = texReady && (reduced || minDelayDone);

  useEffect(() => {
    if (revealed) onRevealed?.();
  }, [revealed, onRevealed]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "80px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (lostTimer.current) window.clearTimeout(lostTimer.current);
    },
    [],
  );

  // Watch the real GL context. A lost context often comes straight back (the
  // browser reclaimed the GPU for a moment) and three.js re-uploads on its own,
  // so we wait out a short grace period before falling back; if it's restored
  // we drop the fallback and force a repaint.
  const handleCreated = useCallback(
    (state: { gl: THREE.WebGLRenderer; invalidate: () => void }) => {
      const canvas = state.gl.domElement;
      const onLost = (e: Event) => {
        e.preventDefault(); // required so the browser will fire "restored"
        if (lostTimer.current) window.clearTimeout(lostTimer.current);
        lostTimer.current = window.setTimeout(() => setGlDown(true), 1200);
      };
      const onRestored = () => {
        if (lostTimer.current) window.clearTimeout(lostTimer.current);
        setGlDown(false);
        state.invalidate();
      };
      canvas.addEventListener("webglcontextlost", onLost as EventListener);
      canvas.addEventListener(
        "webglcontextrestored",
        onRestored as EventListener,
      );
    },
    [],
  );

  const animate = !reduced;
  // motion only begins once the globe is revealed — before that the frames
  // are silent warm-up renders (shader compile, texture upload) at opacity 0
  const live = animate && revealed;
  const frameloop = reduced ? "demand" : inView ? "always" : "never";

  // The Canvas is client-only (HeroGlobe imports this with ssr:false), so it
  // always mounts here — three.js manages its own WebGL context. No support
  // gate: probing a throwaway context false-negatived under the browser's
  // per-process context cap and hid the globe. If the real context is lost or
  // can't be created, GlobeFallback stands in for it (see below).
  return (
    <div
      ref={wrap}
      className="pointer-events-auto relative h-full w-full"
      style={{
        // staged entrance: soft fade + settle-in scale once ready
        opacity: revealed ? 1 : 0,
        transform: revealed ? "scale(1)" : "scale(0.975)",
        transition: reduced
          ? undefined
          : "opacity 1000ms ease, transform 1200ms cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: revealed ? undefined : "opacity, transform",
      }}
    >
      <GLErrorBoundary fallback={<GlobeFallback />}>
        <Canvas
          frameloop={frameloop}
          camera={{ fov: 45, near: 0.1, far: 50, position: [0, 0.1, 3.8] }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onCreated={handleCreated}
          style={{
            background: "transparent",
            opacity: glDown ? 0 : 1,
            transition: "opacity 300ms ease",
          }}
        >
        {/* keyed on the reveal so the dolly's clock restarts right as the
            globe fades in — the camera move IS the entrance */}
        <CameraDolly key={revealed ? "live" : "warmup"} enabled={live} />
        <Suspense fallback={null}>
          {/* staggers texture upload + shader compile across invisible
              frames, then flips texReady */}
          <WarmUp onVisible={onSceneVisible} onReady={onTexturesReady} />
          {/* hidden until the textures are on the GPU — an invisible group
              never enters the render list, so nothing compiles early.
              (reduced motion runs frameloop="demand", where the warm-up
              frames may never tick — show the scene at once instead.) */}
          <group visible={reduced || sceneVisible}>
            <ParallaxRig enabled={live}>
              {/* volumetric sunrise back-glow, behind the upper-right shoulder */}
              <mesh position={[0.55, 0.35, -0.9]} renderOrder={-1}>
                <planeGeometry args={[6.4, 6.4]} />
                <shaderMaterial
                  vertexShader={volumeVertex}
                  fragmentShader={volumeFragment}
                  transparent
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              {/* Drag to rotate + page-scroll to rotate the whole globe */}
              <GlobeControls enabled={live}>
                <Earth animate={live} />
                {RING_DEFS.map((def, i) => (
                  <OrbitalRing key={i} def={def} animate={live} />
                ))}
                <FloatingSparks animate={live} />
              </GlobeControls>
            </ParallaxRig>
          </group>
        </Suspense>

        {/* No post-processing: an EffectComposer renders into an opaque
            buffer, which paints the whole square canvas black over the page
            background. The glow sprites carry their own soft falloff, so
            bloom isn't needed — and the canvas stays truly transparent. */}
      </Canvas>
      </GLErrorBoundary>
      {/* stand-in shown when the live context drops and doesn't come back */}
      {glDown && <GlobeFallback />}
    </div>
  );
}
