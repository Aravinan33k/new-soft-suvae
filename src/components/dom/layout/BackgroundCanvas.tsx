"use client";

import dynamic from "next/dynamic";

// The whole experience renders behind the page content, pinned to the
// viewport. Lazy-loaded client-only: three.js never blocks first paint.
const CanvasRoot = dynamic(() => import("@/components/canvas/CanvasRoot"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#010208]" aria-hidden />,
});

export default function BackgroundCanvas() {
  return (
    <div className="fixed inset-0 z-0">
      <CanvasRoot />
    </div>
  );
}
