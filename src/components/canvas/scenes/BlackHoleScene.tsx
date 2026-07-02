"use client";

import BlackHole from "@/components/canvas/blackhole/BlackHole";
import AccretionDisk from "@/components/canvas/blackhole/AccretionDisk";
import Particles from "@/components/canvas/blackhole/Particles";
import CameraRig from "@/components/canvas/blackhole/CameraRig";

export default function BlackHoleScene() {
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <>
      <color attach="background" args={["#010208"]} />
      <Particles />
      <BlackHole />
      <AccretionDisk count={isMobile ? 1200 : 2600} />
      <CameraRig />
    </>
  );
}
