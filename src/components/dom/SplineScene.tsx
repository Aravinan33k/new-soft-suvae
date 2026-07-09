"use client";

import { Suspense, lazy, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Live 3D Spline scene, dropped into any chapter to replace its canvas story.
// The runtime is lazy-loaded so it never ships in the initial bundle and only
// touches `window` on the client (Next 16 SSR-safe). Reduced-motion renders
// nothing so the lightweight canvas underneath shows instead.
const Spline = lazy(() => import("@splinetool/react-spline"));

type Props = {
  /** Spline "Viewer" URL ending in .splinecode (Export → Viewer in Spline). */
  scene?: string;
  className?: string;
};

export default function SplineScene({ scene, className = "" }: Props) {
  const reduced = useReducedMotion();
  const [loaded, setLoaded] = useState(false);

  // Respect reduced motion — skip the heavy 3D and let the canvas play.
  if (reduced) return null;

  // No URL yet → an on-brand placeholder telling you where to paste it.
  if (!scene) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="max-w-xs rounded-2xl border border-dashed border-[#FF8A3D]/30 bg-black/30 px-6 py-8 text-center backdrop-blur-sm">
          <p className="text-sm font-semibold text-white">Spline scene slot</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            In Spline choose{" "}
            <span className="text-[#FFB057]">Export → Viewer</span>, copy the{" "}
            <span className="text-[#FFB057]">.splinecode</span> URL, and paste it
            into <span className="text-[#FFB057]">SPLINE_SCENES</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* loading shimmer until the scene reports ready */}
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#FF8A3D]/30 border-t-[#FF8A3D]" />
        </div>
      )}
      <Suspense fallback={null}>
        <Spline
          scene={scene}
          onLoad={() => setLoaded(true)}
          style={{ width: "100%", height: "100%" }}
        />
      </Suspense>
    </div>
  );
}
