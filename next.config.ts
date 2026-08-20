import type { NextConfig } from "next";

/**
 * SPEC-001 / TASK-006 Q-SA-5: frontend and backend are served on the SAME ORIGIN
 * with `/api/*` proxied to the backend. In local development the backend runs on
 * its own port, so we proxy there; in production the reverse proxy does it and
 * this rewrite is a no-op because the request never reaches Next.
 */
const nextConfig: NextConfig = {
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    if (!target) return [];
    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },
};

export default nextConfig;
