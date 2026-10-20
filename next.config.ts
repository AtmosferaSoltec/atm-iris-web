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
    // Routes are in English now; the old Spanish ones (and older names) keep working.
    // Temporary redirects: nothing new gets cached in browsers. /letras once answered
    // as a permanent redirect target of /canciones, and both now end at /songs: no loop.
    const moved: [string, string][] = [
      ["/canciones/nueva", "/songs/new"],
      ["/canciones", "/songs"],
      ["/letras", "/songs"],
      ["/musica", "/songs"],
      ["/servicios/nuevo", "/services/new"],
      ["/servicios", "/services"],
      ["/ajustes", "/settings"],
      ["/cuenta", "/account"],
      ["/fondos", "/backgrounds"],
      ["/multimedia", "/media"],
      ["/personas", "/people"],
      ["/tiempos", "/times"],
      ["/consola", "/console"],
      ["/pantalla", "/display"],
      ["/recuperar/codigo", "/recover/code"],
      ["/recuperar/nueva", "/recover/new-password"],
      ["/recuperar", "/recover"],
      // The plan is the SERVICIO list of the console: it has no page of its own.
      ["/plan", "/console"],
    ];
    return moved.flatMap(([source, destination]) => [
      { source, destination, permanent: false },
      { source: `${source}/:path*`, destination: `${destination}/:path*`, permanent: false },
    ]);
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
