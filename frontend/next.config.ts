import type { NextConfig } from "next";

/** Set in docker-compose so webpack uses polling on bind-mounted volumes (esp. Windows). */
const isDockerDev = process.env.DOCKER_DEV === "true";

const nextConfig: NextConfig = {
  /** Standalone output for the production Docker image (node server.js). */
  output: "standalone",
  poweredByHeader: false,
  /**
   * Django owns trailing-slash semantics under /svc/api (the admin requires
   * them; Next's default 308 slash-stripping would fight Django's APPEND_SLASH
   * in a redirect loop). proxy.ts proxies /svc/api/* with exact paths and
   * re-applies the default redirect for all other paths.
   * See: node_modules/next/dist/docs → file-conventions/proxy.
   */
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: process.cwd(),
  },
  webpack: (config, { dev }) => {
    if (dev && isDockerDev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  /**
   * Baseline security headers. For a full nonce-based Content-Security-Policy
   * (recommended once you handle user data), follow:
   * https://nextjs.org/docs/app/guides/content-security-policy
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
