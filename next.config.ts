import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lets the course book and title morph between /courses and /courses/[slug] (real routes, so SEO is unchanged)
  experimental: { viewTransition: true },
};

export default nextConfig;
