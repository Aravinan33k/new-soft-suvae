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
};

export default nextConfig;
