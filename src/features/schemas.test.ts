import { describe, expect, it } from "vitest";
import { serviceTypeDraftSchema } from "./service-types/schemas";
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
    });
  });

  it("requires a title and some lyrics", () => {
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

describe("serviceTypeDraftSchema", () => {
  const draft = {
    id: null,
    name: "Culto general",
    color: "#FFB547",
    schedule: { weekday: 1, hour: 10, minute: 0 },
    tracksTime: true,
    blocks: [{ id: "b1", name: "Prédica", plannedMinutes: 40, defaultPersonId: null }],
  };

  it("accepts a valid draft", () => {
    expect(serviceTypeDraftSchema.safeParse(draft).success).toBe(true);
  });

  it("requires blocks when time is tracked", () => {
    const result = serviceTypeDraftSchema.safeParse({ ...draft, blocks: [] });
    expect(result.error?.issues[0].path).toEqual(["blocks"]);
  });

  it("only accepts palette colors and 1–240 minutes", () => {
    expect(serviceTypeDraftSchema.safeParse({ ...draft, color: "#000000" }).success).toBe(false);
    const tooLong = { ...draft, blocks: [{ ...draft.blocks[0], plannedMinutes: 241 }] };
    expect(serviceTypeDraftSchema.safeParse(tooLong).success).toBe(false);
  });
});
