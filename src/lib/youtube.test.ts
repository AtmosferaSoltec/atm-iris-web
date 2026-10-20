import { describe, expect, it } from "vitest";
import { isYouTubeMusicLink, youTubeVideoId } from "./youtube";

describe("youTubeVideoId", () => {
  it("reads every usual link", () => {
    for (const link of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=PL123",
      "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://music.youtube.com/watch?v=dQw4w9WgXcQ&si=xyz",
      "https://youtu.be/dQw4w9WgXcQ?si=abc",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube.com/live/dQw4w9WgXcQ",
      "youtube.com/watch?v=dQw4w9WgXcQ",
      "dQw4w9WgXcQ",
    ]) {
      expect(youTubeVideoId(link), link).toBe("dQw4w9WgXcQ");
    }
  });

  it("tells YouTube Music links apart", () => {
    expect(isYouTubeMusicLink("https://music.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
    expect(isYouTubeMusicLink("music.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
    expect(isYouTubeMusicLink("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(false);
    expect(isYouTubeMusicLink("dQw4w9WgXcQ")).toBe(false);
  });

  it("rejects what is not a YouTube video", () => {
    for (const link of ["https://vimeo.com/123", "https://www.youtube.com/", "hola", ""]) {
      expect(youTubeVideoId(link), link).toBeNull();
    }
  });
});
