import { describe, expect, it } from "vitest";
import { firstLine, formatLyrics, parseLyrics, titleFromFileName } from "./lyrics";

describe("parseLyrics", () => {
  it("splits sections on blank lines and trims lines", () => {
    const sections = parseLyrics("  Línea uno \nLínea dos\n\n\n  Línea tres  \r\n");
    expect(sections).toEqual([
      { label: null, text: "Línea uno\nLínea dos" },
      { label: null, text: "Línea tres" },
    ]);
  });

  it("reads bracketed and well-known labels", () => {
    const sections = parseLyrics("[Estrofa 1]\nA\n\nCoro:\nB\n\npuente\nC\n\nFinal:\nD");
    expect(sections.map((s) => s.label)).toEqual(["Estrofa 1", "Coro", "Puente", "Final"]);
    expect(sections.map((s) => s.text)).toEqual(["A", "B", "C", "D"]);
  });

  it("applies a lone label to the next section", () => {
    expect(parseLyrics("[Coro]\n\nSanto es el Señor")).toEqual([
      { label: "Coro", text: "Santo es el Señor" },
    ]);
  });

  it("does not treat lyric lines ending with a colon as labels", () => {
    const [section] = parseLyrics("Y cuando en Sion por siglos mil brillando:\nyo cantaré");
    expect(section.label).toBeNull();
  });

  it("returns nothing for blank input", () => {
    expect(parseLyrics(" \n\n ")).toEqual([]);
  });
});

describe("formatLyrics", () => {
  it("round-trips with parseLyrics", () => {
    const sections = [
      { label: "Estrofa 1", text: "Sublime gracia del Señor\nque a un pecador salvó" },
      { label: null, text: "Sin nombre" },
    ];
    expect(parseLyrics(formatLyrics(sections))).toEqual(sections);
  });
});

describe("helpers", () => {
  it("derives a title from a file name", () => {
    expect(titleFromFileName("sublime_gracia-final.txt")).toBe("sublime gracia final");
  });

  it("returns the first projected line", () => {
    expect(firstLine([{ text: "Uno\nDos" }])).toBe("Uno");
    expect(firstLine([])).toBeNull();
  });
});
