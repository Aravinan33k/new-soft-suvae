"use client";

import NeuralNetwork from "@/components/canvas/neural/NeuralNetwork";
import NeuralCore from "@/components/canvas/neural/NeuralCore";
import NeuralCamera from "@/components/canvas/neural/NeuralCamera";
import AmbientField from "@/components/canvas/neural/AmbientField";

// "From Complexity to Intelligence" — scattered particles assemble into a
// glowing neural web around an awakening AI core, with data pulsing through
// the connections. All driven by the box's scroll progress.
export default function NeuralScene() {
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <>
      <color attach="background" args={["#02040a"]} />
      <AmbientField count={isMobile ? 400 : 900} />
      <NeuralNetwork />
      <NeuralCore />
      <NeuralCamera />
    </>
  );
}
