import { describe, expect, it } from "vitest";
import { songFormSchema } from "./songs/schemas";

describe("songFormSchema", () => {
  it("turns pasted lyrics into sections", () => {
    const result = songFormSchema.parse({
      title: " Sublime gracia ",
      author: "",
      lyrics: "#Coro\nA\n\nB",
    });
    expect(result).toEqual({
      title: "Sublime gracia",
      author: "",
      sections: [
        { label: "Coro", text: "A" },
        { label: null, text: "B" },
      ],
      audioId: null,
      youtubeId: null,
    });
  });

  it("takes a song that is only a track", () => {
    const result = songFormSchema.parse({
      title: "Hoy te salvo",
      author: "",
      lyrics: "",
      audioId: "01a10cb0-1d73-709f-b03e-c6c9c36a17f0",
    });
    expect(result).toMatchObject({ sections: [], audioId: "01a10cb0-1d73-709f-b03e-c6c9c36a17f0" });
  });

  it("requires a title and lyrics or a track", () => {
    const result = songFormSchema.safeParse({ title: "", author: "", lyrics: "  " });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(["title", "lyrics"]);
  });

  it("rejects a slide name longer than 40 characters", () => {
    const result = songFormSchema.safeParse({
      title: "A",
      author: "",
      lyrics: `#${"x".repeat(41)}\nLetra`,
    });
    expect(result.success).toBe(false);
  });
});
