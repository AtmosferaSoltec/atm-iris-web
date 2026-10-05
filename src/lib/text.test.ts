import { describe, expect, it } from "vitest";
import { durationSummary, scheduleSummary } from "./format";
import { accountInitials, initials, nameKey, plural } from "./text";

describe("text", () => {
  it("compares names without accents, case or surrounding spaces", () => {
    expect(nameKey("  José Pérez ")).toBe(nameKey("jose perez"));
  });

  it("builds initials", () => {
    expect(initials("Daniel Ruiz")).toBe("DR");
    expect(initials("ana")).toBe("A");
    expect(accountInitials("Iglesia de Vida Nueva")).toBe("IV");
  });

  it("pluralizes", () => {
    expect(plural(1, "bloque")).toBe("1 bloque");
    expect(plural(3, "bloque")).toBe("3 bloques");
  });
});

describe("format", () => {
  it("summarizes durations", () => {
    expect(durationSummary(45 * 60)).toBe("45 min");
    expect(durationSummary(70 * 60)).toBe("1 h 10 min");
    expect(durationSummary(120 * 60)).toBe("2 h");
  });

  it("summarizes schedules", () => {
    expect(scheduleSummary({ weekday: 1, hour: 10, minute: 0 })).toBe("Domingo · 10:00");
  });
});
