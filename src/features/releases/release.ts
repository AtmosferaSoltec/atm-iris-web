import { z } from "zod";

const fileSchema = z.object({
  file: z.string(),
  sizeBytes: z.number().int().positive(),
  sha256: z.string(),
});

/** Lo que escribe `scripts/release-manifest.mjs` de la app de escritorio al publicar una versión. */
export const releaseSchema = z.object({
  version: z.string(),
  releasedAt: z.string(),
  windows: z.object({ x64: fileSchema }),
  // Hasta que macOS esté firmado, una versión puede publicarse solo para Windows.
  mac: z.object({ arm64: fileSchema, x64: fileSchema }).optional(),
});
export type Release = z.infer<typeof releaseSchema>;
export type ReleaseFile = z.infer<typeof fileSchema>;

/** Los instaladores y el manifiesto se sirven desde esta carpeta, en el mismo dominio. */
export const RELEASES_URL = "/releases";

export async function fetchLatestRelease(): Promise<Release> {
  const response = await fetch(`${RELEASES_URL}/latest.json`, { cache: "no-store" });
  if (!response.ok) throw new Error("Todavía no hay una versión publicada.");
  return releaseSchema.parse(await response.json());
}

export const fileUrl = (file: ReleaseFile): string => `${RELEASES_URL}/${file.file}`;
