"use client";

import dynamic from "next/dynamic";

// Client wrapper so the three.js core never blocks first paint.
const UltronCore = dynamic(() => import("@/components/canvas/UltronCore"), {
  ssr: false,
  loading: () => null,
});

export default function HeroBrain() {
  return <UltronCore />;
}
