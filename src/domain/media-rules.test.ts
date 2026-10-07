import { describe, expect, it } from "vitest";
import { backgroundProblem, mediaSection } from "./media-rules";

const image = {
  kind: "image" as const,
  contentType: "image/png",
  sizeBytes: 2_000_000,
  width: 1920,
  height: 1080,
  durationSeconds: null,
};
const video = {
  kind: "video" as const,
  contentType: "video/mp4",
  sizeBytes: 20_000_000,
  width: 1920,
  height: 1080,
  durationSeconds: 20,
};

describe("backgroundProblem", () => {
  it("accepts a 1920 × 1080 image and a 20 s MP4", () => {
    expect(backgroundProblem(image)).toBeNull();
    expect(backgroundProblem(video)).toBeNull();
  });

  it("rejects audio, wrong formats and heavy files", () => {
    expect(backgroundProblem({ ...image, kind: "audio" })).toMatch(/audio/i);
    expect(backgroundProblem({ ...video, contentType: "video/quicktime" })).toMatch(/MP4/);
    expect(backgroundProblem({ ...image, sizeBytes: 11 * 1024 * 1024 })).toMatch(/10 MB/);
  });

  it("needs 16:9 and a size inside the range", () => {
    expect(backgroundProblem({ ...image, width: 1080, height: 1080 })).toMatch(/16:9/);
    expect(backgroundProblem({ ...image, width: 640, height: 360 })).toMatch(/entre 1280/);
    expect(backgroundProblem({ ...video, width: 3840, height: 2160 })).toMatch(/entre 1280/);
    expect(backgroundProblem({ ...image, width: 1366, height: 768 })).toBeNull();
    expect(backgroundProblem({ ...image, width: null, height: null })).toMatch(/medir/);
  });

  it("limits a video to 30 seconds", () => {
    expect(backgroundProblem({ ...video, durationSeconds: 30 })).toBeNull();
    expect(backgroundProblem({ ...video, durationSeconds: 31 })).toMatch(/30 segundos/);
  });
});

describe("mediaSection", () => {
  it("puts audio in Música, backgrounds in Fondos and the rest in Multimedia", () => {
    expect(mediaSection({ kind: "audio", isBackground: false })).toBe("music");
    expect(mediaSection({ kind: "image", isBackground: true })).toBe("backgrounds");
    expect(mediaSection({ kind: "video", isBackground: false })).toBe("media");
  });
});
