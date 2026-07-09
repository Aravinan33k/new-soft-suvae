import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Quiet dev terminal: no per-request logs, no browser console forwarding
  logging: {
    incomingRequests: false,
    browserToTerminal: false,
  },
  // Pin the workspace root so Next stops warning about the stray
  // package-lock.json in the user home directory
  turbopack: {
    root: process.cwd(),
  },
  // Next 16 changed the default images.qualities to only [75]; allowlist the
  // custom qualities we actually render (60 for faint backdrops, 72 for the
  // tech-ecosystem photos) so <Image quality=…> doesn't warn/coerce.
  images: {
    qualities: [60, 72, 75],
  },
};

export default nextConfig;
