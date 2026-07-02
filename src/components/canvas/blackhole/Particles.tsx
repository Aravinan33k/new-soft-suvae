"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// Two systems, one draw call each:
//  - Starfield: distant shell, occluded by the hole's shadow (renderOrder 0,
//    drawn before the raymarch pass composites over it)
//  - Space dust: near-camera drift with cursor gravity — particles bend
//    away from the mouse in the vertex shader
const dustVertex = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;

  uniform float uTime;
  uniform vec3 uMouse;

  varying float vAlpha;

  void main() {
    vec3 p = position;

    // Slow individual drift
    p.x += sin(uTime * 0.12 + aSeed * 40.0) * 0.6;
    p.y += cos(uTime * 0.09 + aSeed * 55.0) * 0.45;

    vec4 world = modelMatrix * vec4(p, 1.0);

    // Cursor bends nearby dust: soft inverse-square repulsion
    vec3 d = world.xyz - uMouse;
    float dist2 = dot(d, d);
    world.xyz += normalize(d) * (0.9 / (1.0 + dist2 * 0.8));

    vec4 mv = viewMatrix * world;
    gl_PointSize = aSize * (36.0 / -mv.z);
    vAlpha = 0.18 + aSeed * 0.35;
    gl_Position = projectionMatrix * mv;
  }
`;

const dustFragment = /* glsl */ `
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.1, d);
    gl_FragColor = vec4(vec3(0.65, 0.75, 1.0), soft * vAlpha);
  }
`;

function SpaceDust({ count }: { count: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const mouseWorld = useMemo(() => new THREE.Vector3(0, 0, 100), []);

  const { positions, sizes, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = Math.random() * 10 - 2; // between camera and hole
      sizes[i] = 0.2 + Math.random() * 0.6;
      seeds[i] = Math.random();
    }
    return { positions, sizes, seeds };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector3(0, 0, 100) },
    }),
    []
  );

  useFrame(({ clock, pointer, camera }) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = clock.getElapsedTime();

    // Unproject cursor onto the dust mid-plane (z ≈ 7)
    mouseWorld.set(pointer.x, pointer.y, 0.5).unproject(camera);
    const dir = mouseWorld.sub(camera.position).normalize();
    const t = (7 - camera.position.z) / dir.z;
    if (t > 0) {
      material.current.uniforms.uMouse.value
        .copy(camera.position)
        .addScaledVector(dir, t);
    }
  });

  return (
    <points renderOrder={2} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={dustVertex}
        fragmentShader={dustFragment}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Starfield({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const white = new THREE.Color("#dbeafe");
    const blue = new THREE.Color("#7da2ff");
    const violet = new THREE.Color("#a78bfa");
    for (let i = 0; i < count; i++) {
      // Distant shell so stars sit behind the lensing pass
      const r = 60 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const pick = Math.random();
      const c = pick < 0.7 ? white : pick < 0.88 ? blue : violet;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y += delta * 0.004;
  });

  return (
    <points ref={points} renderOrder={0} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}

export default function Particles() {
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <>
      <Starfield count={isMobile ? 1500 : 3500} />
      <SpaceDust count={isMobile ? 250 : 700} />
    </>
  );
}
