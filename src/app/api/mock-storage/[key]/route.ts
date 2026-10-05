import { env } from "@/server/env";
import { mockWorld } from "@/server/repositories/mock";

// Stand-in for the signed S3 URLs while DATA_SOURCE=mock (phase 05): the
// browser PUTs the bytes here and <img>/<video>/<audio> GET them back. Bytes
// live in the server's memory and vanish on restart. Doesn't exist otherwise.

const notFound = () => new Response(null, { status: 404 });

export async function PUT(request: Request, { params }: RouteContext<"/api/mock-storage/[key]">) {
  if (env.DATA_SOURCE !== "mock") return notFound();
  const { key } = await params;
  const bytes = new Uint8Array(await request.arrayBuffer());
  mockWorld().files.set(key, {
    contentType: request.headers.get("content-type") ?? "application/octet-stream",
    bytes,
  });
  return new Response(null, { status: 200 });
}

export async function GET(request: Request, { params }: RouteContext<"/api/mock-storage/[key]">) {
  if (env.DATA_SOURCE !== "mock") return notFound();
  const { key } = await params;
  const file = mockWorld().files.get(key);
  if (!file) return notFound();

  const size = file.bytes.byteLength;
  const headers = {
    "Content-Type": file.contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
  };
  // Video seeking (and Safari, always) asks for byte ranges.
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    return new Response(file.bytes.slice(start, end + 1), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }
  return new Response(file.bytes, { headers: { ...headers, "Content-Length": String(size) } });
}
