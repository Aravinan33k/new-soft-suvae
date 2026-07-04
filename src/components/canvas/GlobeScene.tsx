"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";

// Photoreal cinematic Earth for the hero — live 3D, continuously rotating.
//
//  - Real NASA-derived textures (public domain, served from /public):
//    day albedo + night city lights, blended by a directional "sun" so
//    the visible hemisphere shows golden city clusters with a lit
//    crescent at the terminator (Black-Marble look).
//  - Warm atmosphere rim + soft volumetric back-glow.
//  - Network arcs between REAL cities (Chennai HQ glows brightest) with
//    traveling data pulses and breathing city nodes.
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

const R = 1.15; // globe radius
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
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNw;
  varying vec3 vNv;
  void main() {
    float sun = dot(normalize(vNw), normalize(uSunDir));
    float dayMix = smoothstep(-0.08, 0.35, sun);

    // day side: real albedo, dimmed and cooled in shadow, warmed in light
    vec3 day = texture2D(uDay, vUv).rgb;
    day *= mix(vec3(0.16, 0.18, 0.24), vec3(0.85, 0.8, 0.72), clamp(sun, 0.0, 1.0));

    // night side: golden city lights over a near-black planet
    vec3 nl = texture2D(uNight, vUv).rgb;
    float lum = dot(nl, vec3(0.299, 0.587, 0.114));
    vec3 city = vec3(1.0, 0.6, 0.25) * pow(lum, 0.8) * 3.2;
    vec3 night = vec3(0.016, 0.018, 0.028) + city;

    vec3 col = mix(night, day, dayMix);

    // soft light band sweeping pole-to-pole, wrapping every 7s
    float sweepY = mod(uTime, 7.0) / 7.0 * 2.6 - 1.3;
    float band = 1.0 - smoothstep(0.0, 0.05, abs(normalize(vNw).y - sweepY));
    col += vec3(1.0, 0.92, 0.75) * band * 0.45;

    // warm atmosphere rim
    float fres = pow(1.0 - abs(dot(normalize(vNv), vec3(0.0, 0.0, 1.0))), 2.8);
    col += vec3(1.0, 0.5, 0.24) * fres * 0.28;

    gl_FragColor = vec4(col, 1.0);
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

const normalVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Outer atmosphere halo (back side, alpha follows intensity)
const atmoFragment = /* glsl */ `
  precision highp float;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.6 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 3.4);
    gl_FragColor = vec4(vec3(1.0, 0.45, 0.2), max(intensity, 0.0) * 0.55);
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
    gl_FragColor = vec4(vec3(1.0, 0.42, 0.18), fall * fall * 0.16);
  }
`;

// ---------------------------------------------------------------------

const ARC_SEG = 36;
const PULSE_COLORS = ["#ff6a3d", "#ffffff", "#ffd37a"];
const FLASH_DUR = 1.1; // seconds a hub node takes to flash orange -> white -> orange
// Sun sits behind the planet's upper-right shoulder: the hemisphere facing
// the camera stays in night (golden city lights) with a lit crescent at
// the top-right limb — the reference "Black Marble" composition.
const SUN_DIR = new THREE.Vector3(0.55, 0.5, -0.65).normalize();

function Earth({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const pulsesGeo = useRef<THREE.BufferGeometry>(null);
  const hubsGeo = useRef<THREE.BufferGeometry>(null);

  const [dayMap, nightMap] = useLoader(THREE.TextureLoader, [
    "/textures/earth_day.jpg",
    "/textures/earth_lights.png",
  ]);
  useMemo(() => {
    for (const t of [dayMap, nightMap]) {
      t.anisotropy = 8;
      t.wrapS = THREE.RepeatWrapping;
    }
  }, [dayMap, nightMap]);

  const data = useMemo(() => {
    const hubs = CITIES.map(([lat, lon]) => latLonToVec3(lat, lon));

    // Arcs: slerp paths between cities, lifted above the surface
    const arcs: Float32Array[] = [];
    const linePos: number[] = [];
    const lineCol: number[] = [];
    const lineColor = new THREE.Color("#ff8a3d");
    for (const [i, j] of LINKS) {
      const a = hubs[i];
      const b = hubs[j];
      const angle = a.angleTo(b);
      const lift = 0.04 + angle * 0.075;
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
    const pulseCount = arcs.length;
    const pulsePhase = new Float32Array(pulseCount);
    const pulseSpeed = new Float32Array(pulseCount);
    const pulseColor = new Float32Array(pulseCount * 3);
    const pulseSize = new Float32Array(pulseCount).fill(2.0);
    const tmpColor = new THREE.Color();
    for (let p = 0; p < pulseCount; p++) {
      pulsePhase[p] = Math.random();
      pulseSpeed[p] = 1 / (2.4 + Math.random() * 1.8);
      tmpColor.set(PULSE_COLORS[Math.floor(Math.random() * PULSE_COLORS.length)]);
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
      tmpColor.set(i === 0 ? "#ffe0a3" : Math.random() < 0.3 ? "#ffd37a" : "#ff8a3d");
      hubColor.set([tmpColor.r, tmpColor.g, tmpColor.b], i * 3);
      hubSize[i] = i === 0 ? 3.4 : 1.7 + Math.random() * 0.9;
      hubPhase[i] = Math.random() * 10;
      // staggered so nodes never flash in sync — each reschedules itself
      hubFlashAt[i] = 2 + Math.random() * 14;
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
  const pulsePosBuf = useMemo(() => new Float32Array(pulseCount * 3), [pulseCount]);
  const pulseBrightBuf = useMemo(() => new Float32Array(pulseCount), [pulseCount]);
  const hubBrightBuf = useMemo(
    () => new Float32Array(data.hubPos.length / 3).fill(1),
    [data.hubPos],
  );
  // mutable per-frame color (base orange/gold, occasionally lerped to white)
  const hubColorBuf = useMemo(() => data.hubColor.slice(), [data.hubColor]);

  const earthUniforms = useMemo(
    () => ({
      uDay: { value: dayMap },
      uNight: { value: nightMap },
      uSunDir: { value: SUN_DIR },
      uTime: { value: 0 },
    }),
    [dayMap, nightMap],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      // starts over India (HQ) then spins — one revolution every 120s
      group.current.rotation.y = 3.32 + (animate ? t * SPIN : 0);
      group.current.rotation.x = -0.18;
      // gentle breathing zoom: 100% -> 102% -> 100% every 8s
      const zoom = animate ? 1 + 0.01 * (1 - Math.cos((t / 8) * Math.PI * 2)) : 1;
      group.current.scale.setScalar(zoom);
    }
    earthUniforms.uTime.value = t;
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
      const flashAt = data.hubFlashAt[h];
      if (t >= flashAt && t < flashAt + FLASH_DUR) {
        flash = Math.sin(((t - flashAt) / FLASH_DUR) * Math.PI);
      } else if (t >= flashAt + FLASH_DUR) {
        data.hubFlashAt[h] = t + 5 + Math.random() * 16;
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

      {/* atmosphere halo */}
      <mesh renderOrder={0} scale={1.16}>
        <sphereGeometry args={[R, 48, 48]} />
        <shaderMaterial
          vertexShader={normalVertex}
          fragmentShader={atmoFragment}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* network arcs between real cities */}
      <lineSegments renderOrder={2}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.linePos, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.lineCol, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.38}
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
  { r: R * 1.22, tiltX: 1.18, tiltZ: 0.22, speed: 0.12, particles: 7, opacity: 0.12 },
  { r: R * 1.32, tiltX: 1.42, tiltZ: -0.12, speed: -0.07, particles: 9, opacity: 0.09 },
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
    const n = def.particles;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const brightArr = new Float32Array(n);
    const tmp = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
      pos.set([Math.cos(a) * def.r, Math.sin(a) * def.r, 0], i * 3);
      const comet = i === 0;
      tmp.set(comet ? "#ffffff" : "#ffb35c");
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
      size[i] = comet ? 1.6 : 0.4 + Math.random() * 0.4;
      brightArr[i] = comet ? 1.3 : 0.6 + Math.random() * 0.4;
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
            color="#ffab5c"
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
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const size = new Float32Array(N);
    const brightArr = new Float32Array(N);
    const tmp = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const th = Math.random() * Math.PI * 2;
      const rad = R * (1.18 + Math.random() * 0.14);
      const y = (Math.random() - 0.5) * R * 1.7;
      pos.set([Math.cos(th) * rad, y, Math.sin(th) * rad], i * 3);
      tmp.set(Math.random() < 0.25 ? "#ffd37a" : "#ff8a3d");
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
      size[i] = 0.08 + Math.random() * 0.16;
      brightArr[i] = 0.3 + Math.random() * 0.4;
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

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
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

  return (
    <div ref={wrap} className="h-full w-full">
      <Canvas
        frameloop={frameloop}
        camera={{ fov: 45, near: 0.1, far: 50, position: [0, 0.1, 3.8] }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <CameraDolly enabled={animate} />
        <Suspense fallback={null}>
          <ParallaxRig enabled={animate}>
            <mesh position={[0, 0, -0.9]} renderOrder={-1}>
              <planeGeometry args={[6.4, 6.4]} />
              <shaderMaterial
                vertexShader={volumeVertex}
                fragmentShader={volumeFragment}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            <Earth animate={animate} />
            {RING_DEFS.map((def, i) => (
              <OrbitalRing key={i} def={def} animate={animate} />
            ))}
            <FloatingSparks animate={animate} />
          </ParallaxRig>
        </Suspense>
      </Canvas>
    </div>
  );
}
