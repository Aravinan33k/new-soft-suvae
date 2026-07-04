"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = [
  "/carousel/01-ai-chatbot-assistant.jpg",
  "/carousel/02-mobile-app-ui.jpg",
  "/carousel/03-ai-data-interface.jpg",
  "/carousel/04-cross-platform-software.jpg",
  "/carousel/05-global-network.jpg",
  "/carousel/06-cloud-computing.jpg",
];

const INTERVAL_MS = 1000;

// Shared background for the Services grid: cycles through the AI/software
// service artwork every second with a soft cross-dissolve (all frames are
// mounted at once — only opacity toggles — so nothing pops in unloaded mid-fade).
export default function ServicesCarouselBackground() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {SLIDES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes="100vw"
          quality={60}
          priority={i === 0}
          className="object-cover transition-opacity ease-in-out"
          style={{
            opacity: i === active ? 1 : 0,
            transitionDuration: "700ms",
          }}
        />
      ))}
      {/* Light edge darkening only — the artwork itself should read clearly */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_65%_at_50%_45%,rgba(10,10,12,0.1)_0%,rgba(10,10,12,0.28)_65%,rgba(10,10,12,0.5)_100%)]" />
    </div>
  );
}
