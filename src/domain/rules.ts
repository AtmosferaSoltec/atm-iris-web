import type { BlockTemplate, ServiceRecord, ServiceType } from "./models";

/** Colors a service can take: the spectrum tokens plus success. */
export const SERVICE_PALETTE = [
  { value: "#FFB547", name: "Ámbar" },
  { value: "#FF7A59", name: "Coral" },
  { value: "#F0508C", name: "Rosa" },
  { value: "#9B5CFF", name: "Violeta" },
  { value: "#4E5BFF", name: "Índigo" },
  { value: "#3DDC97", name: "Verde" },
] as const;

/** Rotating colors for avatars, timelines and rows (`SPECTRUM[i % 5]`). */
export const SPECTRUM = ["#FFB547", "#FF7A59", "#F0508C", "#9B5CFF", "#4E5BFF"] as const;

export const BLOCK_MINUTES = { min: 1, max: 240, default: 10 } as const;

export function spectrumColor(index: number): string {
  return SPECTRUM[index % SPECTRUM.length];
}

export function tracksTime(type: ServiceType): boolean {
  return type.blocks.length > 0;
}

export function plannedSeconds(blocks: BlockTemplate[]): number {
  return blocks.reduce((total, block) => total + block.plannedMinutes * 60, 0);
}

/** Times each person led a block in the records. Skipped blocks don't count. */
export function blockCountsByPerson(records: ServiceRecord[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const record of records) {
    for (const block of record.blocks) {
      if (block.status === "skipped" || !block.personId) continue;
      counts.set(block.personId, (counts.get(block.personId) ?? 0) + 1);
    }
  }
  return counts;
}
