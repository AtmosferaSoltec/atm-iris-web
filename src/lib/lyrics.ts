// Plain-text lyrics ⇄ song sections.
//
// Format (what people paste or upload as .txt):
//   - A blank line starts a new section (one section = one screen on the TV).
//   - A section may start with its name: "[Coro]", "Coro:", "Estrofa 2", "Puente"…
//     That line becomes the label and is not projected.

export type ParsedSection = { label: string | null; text: string };

const BRACKETED = /^\[(.+)\]$/;
const KNOWN_LABEL =
  /^(coro|estrofa|verso|puente|pre-?coro|precoro|intro|final|outro|interludio|tag|vamp|estribillo)(\s+\d+)?\s*:?$/i;
const TRAILING_COLON = /^([^:]{1,30}):$/;

export const LYRICS_LIMITS = { maxSections: 80, maxLinesPerSection: 12 } as const;

function labelFrom(line: string): string | null {
  const trimmed = line.trim();
  const bracketed = BRACKETED.exec(trimmed);
  if (bracketed) return bracketed[1].trim() || null;
  if (KNOWN_LABEL.test(trimmed)) return capitalize(trimmed.replace(/:$/, "").trim());
  const colon = TRAILING_COLON.exec(trimmed);
  if (colon && trimmed.split(/\s+/).length <= 3) return capitalize(colon[1].trim());
  return null;
}

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase("es") + value.slice(1);
}

export function parseLyrics(raw: string): ParsedSection[] {
  const blocks = raw
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((lines) => lines.length > 0);

  const sections: ParsedSection[] = [];
  let pendingLabel: string | null = null;

  for (const lines of blocks) {
    const label = labelFrom(lines[0]);
    const body = label ? lines.slice(1) : lines;
    if (body.length === 0) {
      // A label on its own ("[Coro]" + blank line) names the next block.
      pendingLabel = label;
      continue;
    }
    sections.push({ label: label ?? pendingLabel, text: body.join("\n") });
    pendingLabel = null;
  }
  return sections;
}

/** Inverse of `parseLyrics`, used to edit an existing song as plain text. */
export function formatLyrics(sections: { label: string | null; text: string }[]): string {
  return sections
    .map((section) => (section.label ? `[${section.label}]\n${section.text}` : section.text))
    .join("\n\n");
}

/** "Sublime gracia.txt" → "Sublime gracia". */
export function titleFromFileName(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function firstLine(sections: { text: string }[]): string | null {
  return sections[0]?.text.split("\n")[0] ?? null;
}
