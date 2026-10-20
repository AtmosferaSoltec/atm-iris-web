import { describe, expect, it } from "vitest";
import { verseText } from "./bible-text";

describe("verseText", () => {
  it("drops the brackets around supplied words and keeps the words", () => {
    expect(verseText("todas las cosas les ayudan á bien, [es á saber], á los que")).toBe(
      "todas las cosas les ayudan á bien, es á saber, á los que",
    );
  });
});
