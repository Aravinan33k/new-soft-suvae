"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";

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

// Real network cities — index 0 is Soft Suave HQ (Chennai), kept brightest
const CITIES: [number, number][] = [
  [13.08, 80.27], // Chennai (HQ)
  [19.07, 72.88], // Mumbai
  [25.2, 55.27], // Dubai
  [1.35, 103.82], // Singapore
  [35.68, 139.69], // Tokyo
  [-33.87, 151.21], // Sydney
  [51.51, -0.13], // London
  [50.11, 8.68], // Frankfurt
  [40.71, -74.01], // New York
  [37.77, -122.42], // San Francisco
  [43.65, -79.38], // Toronto
  [-23.55, -46.63], // São Paulo
  [-26.2, 28.05], // Johannesburg
  [37.57, 126.98], // Seoul
  [19.43, -99.13], // Mexico City
];
const LINKS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 6], [0, 4],
  [1, 2], [2, 6], [2, 12], [3, 4], [3, 5],
  [4, 13], [4, 9], [6, 7], [6, 8], [8, 9],
  [8, 10], [8, 11], [9, 14], [11, 12],
  // extra links to densify the cage
  [0, 5], [1, 3], [2, 7], [3, 13], [5, 11],
  [6, 11], [7, 8], [7, 12], [9, 11], [10, 14],
  [8, 14], [4, 5], [1, 12], [6, 10], [0, 7],
];

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

function Earth({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const pulsesGeo = useRef<THREE.BufferGeometry>(null);
  const hubsGeo = useRef<THREE.BufferGeometry>(null);

  const [dayMap, nightMap, cloudMap] = useLoader(THREE.TextureLoader, [
    "/textures/earth_day.jpg",
    "/textures/earth_lights.jpg",
    "/textures/earth_clouds.jpg",
  ]);
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
      // reference — thin orange great-circles hugging the planet.
      const lift = 0.035 + angle * 0.075;
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
    const pulseSize = new Float32Array(pulseCount).fill(2.0);
    const tmpColor = new THREE.Color();
    for (let p = 0; p < pulseCount; p++) {
      pulsePhase[p] = rand();
      pulseSpeed[p] = 1 / (2.4 + rand() * 1.8);
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

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      // frames Europe / Africa / Middle East / India toward the camera
      // (~35°E at centre, India to the right toward the sunrise limb) then
      // spins slowly — one revolution every 120s
      group.current.rotation.y = -2.2 + (animate ? t * SPIN : 0);
      group.current.rotation.x = -0.18;
      // gentle breathing zoom: 100% -> 102% -> 100% every 8s
      const zoom = animate ? 1 + 0.01 * (1 - Math.cos((t / 8) * Math.PI * 2)) : 1;
      group.current.scale.setScalar(zoom);
    }
    // clouds drift slowly relative to the ground — weather, not paint
    if (cloudsRef.current) cloudsRef.current.rotation.y = animate ? t * 0.007 : 0;
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
      pulseBrightBuf[p] = Math.sin(prog * Math.PI);
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

      {/* network arcs between real cities */}
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

      {/* data pulses riding the arcs */}
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

// Two faint orbital rings with a few small lights
const RING_DEFS = [
  { r: R * 1.2, tiltX: 1.18, tiltZ: 0.22, speed: 0.12, particles: 7, opacity: 0.26 },
  { r: R * 1.32, tiltX: 1.42, tiltZ: -0.12, speed: -0.07, particles: 9, opacity: 0.18 },
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
      const rad = R * (1.18 + rand() * 0.14);
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

export default function GlobeScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const reduced = usePrefersReducedMotion();

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

  const animate = !reduced;
  const frameloop = reduced ? "demand" : inView ? "always" : "never";

  // The Canvas is client-only (HeroGlobe imports this with ssr:false), so it
  // always mounts here — three.js manages its own WebGL context. No support
  // gate: probing a throwaway context false-negatived under the browser's
  // per-process context cap and hid the globe.
  return (
    <div ref={wrap} className="pointer-events-auto h-full w-full">
      <Canvas
        frameloop={frameloop}
        camera={{ fov: 45, near: 0.1, far: 50, position: [0, 0.1, 3.8] }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <CameraDolly enabled={animate} />
        <Suspense fallback={null}>
          <ParallaxRig enabled={animate}>
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
            <GlobeControls enabled={animate}>
              <Earth animate={animate} />
              {RING_DEFS.map((def, i) => (
                <OrbitalRing key={i} def={def} animate={animate} />
              ))}
              <FloatingSparks animate={animate} />
            </GlobeControls>
          </ParallaxRig>
        </Suspense>

        {/* No post-processing: an EffectComposer renders into an opaque
            buffer, which paints the whole square canvas black over the page
            background. The glow sprites carry their own soft falloff, so
            bloom isn't needed — and the canvas stays truly transparent. */}
      </Canvas>
    </div>
  );
}
