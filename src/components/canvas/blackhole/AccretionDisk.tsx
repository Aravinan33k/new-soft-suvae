"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { scrollState } from "@/lib/scrollState";

const TILT = 0.24;
const TWO_PI = Math.PI * 2;

// 3D particle layer over the raymarched disk: keplerian orbits computed in
// the vertex shader (zero CPU work per frame), giving real parallax and the
// "disk spins faster than the horizon" motion. Particles behind the hole
// fade out where the shadow would occlude them.
const diskVertex = /* glsl */ `
  attribute float aRadius;
  attribute float aTheta;
  attribute float aY;
  attribute float aSize;
  attribute float aSeed;

  uniform float uTime;
  uniform vec3 uCamPos;

  varying float vRadial;
  varying float vFade;

  void main() {
    // Keplerian angular velocity: inner particles lap outer ones
    float omega = 2.6 / pow(aRadius * 0.42, 1.5);
    float ang = aTheta + uTime * omega;
    vec3 local = vec3(cos(ang) * aRadius, aY, sin(ang) * aRadius);

    vec4 world = modelMatrix * vec4(local, 1.0);

    // Fade particles hidden behind the shadow (impact parameter < ~2.6)
    vec3 toHole = -uCamPos;
    vec3 viewDir = normalize(toHole);
    float along = dot(world.xyz - uCamPos, viewDir);
    float holeDist = length(toHole);
    vFade = 1.0;
    if (along > holeDist) {
      vec3 closest = uCamPos + viewDir * along;
      float b = length(world.xyz - closest) * holeDist / along;
      vFade = smoothstep(2.2, 3.1, b);
    }

    vRadial = (aRadius - 3.0) / 5.5;

    vec4 mv = viewMatrix * world;
    gl_PointSize = min(aSize * (90.0 / -mv.z), 14.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const diskFragment = /* glsl */ `
  varying float vRadial;
  varying float vFade;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.05, d);

    vec3 blue = vec3(0.45, 0.65, 1.2);
    vec3 violet = vec3(0.55, 0.3, 1.0);
    vec3 col = mix(blue, violet, clamp(vRadial, 0.0, 1.0));

    gl_FragColor = vec4(col, soft * 0.38 * vFade);
  }
`;

export default function AccretionDisk({ count = 2600 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);

  const attributes = useMemo(() => {
    const radius = new Float32Array(count);
    const theta = new Float32Array(count);
    const y = new Float32Array(count);
    const size = new Float32Array(count);
    const seed = new Float32Array(count);
    const positions = new Float32Array(count * 3); // required by three, unused

    for (let i = 0; i < count; i++) {
      // Bias density toward the hot inner edge
      radius[i] = 3.1 + Math.pow(Math.random(), 1.6) * 5.4;
      theta[i] = Math.random() * TWO_PI;
      y[i] = (Math.random() - 0.5) * 0.12 * (radius[i] / 4);
      size[i] = 0.35 + Math.random() * 0.8;
      seed[i] = Math.random();
    }
    return { radius, theta, y, size, seed, positions };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCamPos: { value: new THREE.Vector3() },
    }),
    []
  );

  useFrame(({ camera, clock }) => {
    if (material.current) {
      material.current.uniforms.uTime.value = clock.getElapsedTime();
      material.current.uniforms.uCamPos.value.copy(camera.position);
    }
    if (group.current) {
      // Match the raymarcher's hole-space transform (inverse order)
      group.current.rotation.set(-TILT, -scrollState.progress * TWO_PI, 0, "YXZ");
    }
  });

  return (
    <group ref={group}>
      <points renderOrder={2} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[attributes.positions, 3]} />
          <bufferAttribute attach="attributes-aRadius" args={[attributes.radius, 1]} />
          <bufferAttribute attach="attributes-aTheta" args={[attributes.theta, 1]} />
          <bufferAttribute attach="attributes-aY" args={[attributes.y, 1]} />
          <bufferAttribute attach="attributes-aSize" args={[attributes.size, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[attributes.seed, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={material}
          vertexShader={diskVertex}
          fragmentShader={diskFragment}
          uniforms={uniforms}
          transparent
          depthTest={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
