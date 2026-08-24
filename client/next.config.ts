import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pinned explicitly. Next.js otherwise infers the workspace root by walking up
  // for lockfiles, and with the repo root sitting above `client/` it picked the
  // wrong directory and warned on every build. This app is self-contained in
  // `client/`, so say so rather than relying on inference.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dv3j72lqn/**",
      },
      {
        // Seeded demo restaurants and dishes are illustrated with Unsplash
        // photography; without this the seeded catalogue renders broken images.
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
