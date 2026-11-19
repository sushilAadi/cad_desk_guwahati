import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lets the course book and title morph between /courses and /courses/[slug] (real routes, so SEO is unchanged)
  experimental: { viewTransition: true },
  images: {
    // older course images are hotlinked from the old site; allow Next's optimiser to fetch and serve them as WebP
    remotePatterns: [{ protocol: "https", hostname: "caddeskindia.com" }],
  },
};

export default nextConfig;
