"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";

const BASE_Y = 0.35;
const LOOK_TARGET: [number, number, number] = [0, 0, 0];

// Cinematic intro dolly (GSAP owns z) + continuous mouse parallax
// (frame loop owns x/y with damping). The two never fight over an axis.
export default function CameraRig() {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.set(0, BASE_Y, 11);
    const tween = gsap.to(camera.position, {
      z: 6.5,
      duration: 2.8,
      ease: "power3.out",
    });
    return () => {
      tween.kill();
    };
  }, [camera]);

  useFrame(({ pointer }, delta) => {
    const targetX = pointer.x * 0.7;
    const targetY = BASE_Y + pointer.y * 0.45;
    // Frame-rate independent damping
    const damp = 1 - Math.exp(-2.2 * delta);
    camera.position.x += (targetX - camera.position.x) * damp;
    camera.position.y += (targetY - camera.position.y) * damp;
    camera.lookAt(...LOOK_TARGET);
  });

  return null;
}
