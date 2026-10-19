import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // Self-contained server in .next/standalone for the Docker image.
  output: "standalone",
  poweredByHeader: false,
  reactCompiler: true,
  typedRoutes: true,
  experimental: {
    // Pages are dynamic, so by default each visit asks the server again. Keep a
    // visited page 30 s: going back to a tab is instant. Saving, deleting or
    // uploading revalidates, so a person's own changes never show up stale.
    staleTimes: { dynamic: 30 },
  },
  async redirects() {
    // Música (audio) is now the track inside each song. Temporary: nothing new
    // gets cached in browsers.
    return [{ source: "/musica", destination: "/canciones", permanent: false }];
  },
  async rewrites() {
    // Letras became Canciones again (lyrics and track together). Until then
    // /canciones answered a permanent (cached) redirect to /letras, so /letras
    // must keep working without redirecting back, or those browsers would loop.
    return [
      { source: "/letras", destination: "/canciones" },
      { source: "/letras/:path*", destination: "/canciones/:path*" },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
