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

  it("keeps a song's track one to one and deletes it with the song", async () => {
    const { repos } = await signedIn();
    const track = async (size: number) => {
      const ticket = await repos.media.createUpload({
        kind: "audio",
        fileName: "pista.mp3",
        contentType: "audio/mpeg",
        sizeBytes: size,
      });
      mockWorld().files.set(ticket.uploadId, {
        contentType: "audio/mpeg",
        bytes: new Uint8Array(size),
      });
      return repos.media.confirm({ uploadId: ticket.uploadId, title: "Pista" });
    };

    await expect(
      repos.songs.create({
        title: "Vacía",
        author: "",
        sections: [],
        audioId: null,
        youtubeId: null,
        youtubeMusic: false,
      }),
    ).rejects.toMatchObject({ errors: { sections: "Agrega la letra o una pista." } });

    const first = await track(100);
    const song = await repos.songs.create({
      title: "Hoy te salvo",
      author: "",
      sections: [],
      audioId: first.id,
      youtubeId: null,
      youtubeMusic: false,
    });
    expect(song.audio?.id).toBe(first.id);
    await expect(
      repos.songs.create({
        title: "Copia",
        author: "",
        sections: [],
        audioId: first.id,
        youtubeId: null,
        youtubeMusic: false,
      }),
    ).rejects.toMatchObject({ errors: { audioId: "Esa pista ya es de otra canción." } });
    await expect(repos.servicePlan.add({ kind: "media", refId: first.id })).rejects.toMatchObject({
      errors: { refId: "Las pistas se agregan con su canción." },
    });

    // Replacing the track deletes the old one.
    const second = await track(40);
    await repos.songs.update(song.id, {
      title: "Hoy te salvo",
      author: "",
      sections: [{ label: null, text: "Hoy te salvo" }],
      audioId: second.id,
      youtubeId: null,
      youtubeMusic: false,
    });
    expect(await repos.media.get(first.id)).toBeNull();
    expect((await repos.church.get()).storage.breakdown.musicBytes).toBe(40);

    // A YouTube track instead: only the id, the uploaded one goes; never both.
    await expect(
      repos.songs.update(song.id, {
        title: "Hoy te salvo",
        author: "",
        sections: [],
        audioId: second.id,
        youtubeId: "aqz-KE-bpKQ",
        youtubeMusic: false,
      }),
    ).rejects.toMatchObject({
      errors: { youtubeId: "La pista es un audio o un video de YouTube, no los dos." },
    });
    const onYouTube = await repos.songs.update(song.id, {
      title: "Hoy te salvo",
      author: "",
      sections: [],
      audioId: null,
      youtubeId: "aqz-KE-bpKQ",
      youtubeMusic: false,
    });
    expect(onYouTube).toMatchObject({ audio: null, youtubeId: "aqz-KE-bpKQ" });
    expect(await repos.media.get(second.id)).toBeNull();

    await repos.songs.delete(song.id);
  });
});
