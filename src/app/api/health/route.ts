// Liveness probe for Docker / load balancers. No auth, no data access.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", time: new Date().toISOString() });
}
