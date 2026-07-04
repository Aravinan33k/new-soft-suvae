"use client";

import dynamic from "next/dynamic";

const MechaClashScene = dynamic(
  () => import("@/components/canvas/MechaClashScene"),
  { ssr: false, loading: () => null },
);

// Fixed behind the whole Services section; cards above it use a glass
// (backdrop-blur) treatment so the animation shows through.
export default function ServicesBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <MechaClashScene />
      {/* Vignette so the cards/text stay legible over the animation */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_45%,transparent_0%,rgba(10,10,12,0.55)_60%,rgba(10,10,12,0.92)_100%)]" />
    </div>
  );
}
