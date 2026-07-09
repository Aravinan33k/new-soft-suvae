"use client";

import { useState, type ReactNode } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

// Plays a real .lottie (or .json) animation from /public if it loads at
// `src`; otherwise renders `fallback` (the hand-built CSS/SVG scene) so the
// panel is never broken or blank. dotlottie-react fetches the file itself
// and fires "loadError" if it 404s or is malformed — that's our fallback
// trigger, no manual fetch/parse needed.
export default function IndustryLottie({
  src,
  fallback,
}: {
  src: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback}</>;

  return (
    <DotLottieReact
      src={src}
      loop
      autoplay
      className="h-full w-full"
      dotLottieRefCallback={(dotLottie) => {
        dotLottie?.addEventListener("loadError", () => setFailed(true));
      }}
    />
  );
}
