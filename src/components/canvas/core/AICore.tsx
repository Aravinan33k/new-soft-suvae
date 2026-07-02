"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import { fresnelFragment, fresnelVertex } from "@/shaders/fresnel";
import { COLORS } from "@/config/theme";

const ORBIT_COUNT = 320;

function OrbitDust() {
  const points = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(ORBIT_COUNT * 3);
    for (let i = 0; i < ORBIT_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.75 + (Math.random() - 0.5) * 0.5;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.45;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y += delta * 0.25;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={COLORS.glow}
        size={0.02}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function AICore() {
  const inner = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);

  const haloMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: fresnelVertex,
        fragmentShader: fresnelFragment,
        uniforms: {
          uColor: { value: new THREE.Color(COLORS.glow) },
          uIntensity: { value: 1.4 },
          uPower: { value: 2.6 },
          uTime: { value: 0 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 2.1) * 0.045;

    if (inner.current) inner.current.scale.setScalar(pulse);
    if (light.current) light.current.intensity = 26 + Math.sin(t * 2.1) * 9;
    if (ringA.current) {
      ringA.current.rotation.z = t * 0.35;
      ringA.current.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.4) * 0.12;
    }
    if (ringB.current) {
      ringB.current.rotation.z = -t * 0.22;
      ringB.current.rotation.x = -Math.PI / 3 + Math.cos(t * 0.3) * 0.1;
    }
    haloMaterial.uniforms.uTime.value = t;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.7}>
      <group>
        {/* Energy sphere — procedural distortion, no textures */}
        <mesh ref={inner}>
          <icosahedronGeometry args={[1, 24]} />
          <MeshDistortMaterial
            color={COLORS.coreDeep}
            emissive={COLORS.coreEmissive}
            emissiveIntensity={1.05}
            roughness={0.18}
            metalness={0.1}
            distort={0.34}
            speed={2}
          />
        </mesh>

        {/* Glass shell */}
        <mesh>
          <sphereGeometry args={[1.18, 48, 48]} />
          <meshPhysicalMaterial
            color={COLORS.glow}
            transparent
            opacity={0.07}
            roughness={0.05}
            metalness={0}
            clearcoat={1}
            depthWrite={false}
          />
        </mesh>

        {/* Fresnel halo */}
        <mesh material={haloMaterial}>
          <sphereGeometry args={[1.45, 48, 48]} />
        </mesh>

        {/* Energy rings */}
        <mesh ref={ringA} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[1.7, 0.012, 12, 128]} />
          <meshBasicMaterial
            color={COLORS.ring}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh ref={ringB} rotation={[-Math.PI / 3, 0, 0]}>
          <torusGeometry args={[2.05, 0.008, 12, 128]} />
          <meshBasicMaterial
            color={COLORS.coreEmissive}
            transparent
            opacity={0.45}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <OrbitDust />

        {/* The core is the scene's key light — everything is lit by it */}
        <pointLight
          ref={light}
          color={COLORS.coreEmissive}
          intensity={26}
          distance={18}
          decay={2}
        />
      </group>
    </Float>
  );
}
