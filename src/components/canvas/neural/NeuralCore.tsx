"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { scrollState } from "@/lib/scrollState";
import { COLORS } from "@/config/theme";

// The AI core that "awakens" at the centre: a soft volumetric glow sphere
// wrapped in a slowly rotating wireframe icosahedron. It brightens as the
// scene assembles, pulsing like something alive.
export default function NeuralCore() {
  const glow = useRef<THREE.Mesh>(null);
  const wire = useRef<THREE.LineSegments>(null);
  const innerWire = useRef<THREE.LineSegments>(null);

  const wireGeo = useMemo(
    () => new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.5, 1)),
    []
  );
  const innerWireGeo = useMemo(
    () => new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.95, 0)),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const s = scrollState.smooth;
    // Awaken between ~0.08 and ~0.4 of the box scroll
    const wake = THREE.MathUtils.smoothstep(s, 0.08, 0.4);
    const dim = 1;
    const pulse = 0.9 + Math.sin(t * 1.4) * 0.1;

    if (glow.current) {
      const m = glow.current.material as THREE.MeshBasicMaterial;
      m.opacity = (0.08 + wake * 0.5) * pulse * dim;
      const sc = (0.8 + wake * 0.5) * pulse;
      glow.current.scale.setScalar(sc);
    }
    if (wire.current) {
      const m = wire.current.material as THREE.LineBasicMaterial;
      m.opacity = (0.05 + wake * 0.55) * dim;
      wire.current.rotation.y = t * 0.15;
      wire.current.rotation.x = t * 0.08;
    }
    if (innerWire.current) {
      const m = innerWire.current.material as THREE.LineBasicMaterial;
      m.opacity = (0.05 + wake * 0.5) * dim;
      innerWire.current.rotation.y = -t * 0.25;
      innerWire.current.rotation.z = t * 0.12;
    }
  });

  return (
    <group>
      {/* Volumetric glow */}
      <mesh ref={glow}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={COLORS.ring}
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer rotating cage */}
      <lineSegments ref={wire}>
        <primitive object={wireGeo} attach="geometry" />
        <lineBasicMaterial
          color={COLORS.coreEmissive}
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Inner cage */}
      <lineSegments ref={innerWire}>
        <primitive object={innerWireGeo} attach="geometry" />
        <lineBasicMaterial
          color={COLORS.glow}
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}
