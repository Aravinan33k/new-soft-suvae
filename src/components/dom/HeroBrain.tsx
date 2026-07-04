"use client";

import dynamic from "next/dynamic";

// Client wrapper so the three.js brain never blocks first paint.
const BrainScene = dynamic(() => import("@/components/canvas/BrainScene"), {
  ssr: false,
  loading: () => null,
});

export default function HeroBrain() {
  return <BrainScene />;
}
