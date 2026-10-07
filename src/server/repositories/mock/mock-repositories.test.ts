import { beforeEach, describe, expect, it } from "vitest";
import { MOCK_IDS, mockDataRepositories, mockWorld, resetMockWorld } from ".";
import { mockAuth } from "./auth";

async function signedIn(email = "pastor@vidanueva.org") {
  const { session } = await mockAuth().signIn({ email, password: "x" });
  return { session, repos: mockDataRepositories(session) };
}

describe("mock repositories", () => {
  beforeEach(() => resetMockWorld());

  it("seeds the same sample church as the iPad app", async () => {
    const { repos } = await signedIn();
    expect(await repos.people.list()).toHaveLength(8);
    expect((await repos.serviceTypes.list()).map((t) => t.name)).toEqual([
      "ABC",
      "Culto general",
      "Jóvenes",
    ]);
    expect((await repos.records.list()).meta.total).toBe(10);
  });

  it("deleting a person keeps the records that name them", async () => {
    const { repos, session } = await signedIn();
    const church = mockWorld().churches.find((data) => data.church.id === session.church.id)!;
    const leaderId = church.records[0].blocks.find((b) => b.personId)!.personId!;
    await repos.people.delete(leaderId);

    expect(church.records.some((r) => r.blocks.some((b) => b.personId === leaderId))).toBe(true);
    expect(session.church.id).toBe(MOCK_IDS.vidaNueva);
  });

  it("hides a module switched off for all of Iris and keeps the church's choice", async () => {
    const { repos } = await signedIn();
    const church = await repos.church.get();
    expect(church.availableModules.bible).toBe(false);
    expect(church.modules.bible).toBe(false);

    // Saving from Ajustes sends the hidden module as off: the stored choice stays.
    await repos.church.setModules({ bible: false, multimedia: false, timeControl: true });
    const stored = mockWorld().churches.find((data) => data.church.id === church.id)!.church;
    expect(stored.modules).toEqual({ bible: true, multimedia: false, timeControl: true });
    expect((await repos.church.get()).modules).toEqual({
      bible: false,
      multimedia: false,
      timeControl: true,
    });
  });
  it("splits the storage by section and lists several kinds at once", async () => {
    const { repos } = await signedIn();
    const upload = async (
      kind: "audio" | "image",
      contentType: string,
      size: number,
      isBackground = false,
    ) => {
      const ticket = await repos.media.createUpload({
        kind,
        fileName: `archivo.${kind === "audio" ? "mp3" : "png"}`,
        contentType,
        sizeBytes: size,
      });
      mockWorld().files.set(ticket.uploadId, { contentType, bytes: new Uint8Array(size) });
      return repos.media.confirm({
        uploadId: ticket.uploadId,
        title: "Archivo",
        width: isBackground ? 1920 : 640,
        height: isBackground ? 1080 : 360,
        isBackground,
      });
    };
    const track = await upload("audio", "audio/mpeg", 300);
    await upload("image", "image/png", 20, true);
    await upload("image", "image/png", 1000);

    expect((await repos.church.get()).storage).toMatchObject({
      usedBytes: 1320,
      breakdown: { musicBytes: 300, backgroundBytes: 20, mediaBytes: 1000 },
    });
    expect((await repos.media.list({ kind: ["image", "video"] })).meta.total).toBe(2);
    expect((await repos.media.list({ kind: "audio" })).meta.total).toBe(1);

    await repos.media.delete(track.id);
    expect((await repos.church.get()).storage.breakdown.musicBytes).toBe(0);
  });
});
