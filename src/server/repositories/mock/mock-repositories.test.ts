import { beforeEach, describe, expect, it } from "vitest";
import { mockDataRepositories as repos, mockStore, resetMockStore } from ".";

describe("mock repositories", () => {
  beforeEach(() => resetMockStore());

  it("seeds the same sample church as the iPad app", async () => {
    expect(await repos.people.list()).toHaveLength(8);
    expect((await repos.serviceTypes.list()).map((t) => t.name)).toEqual([
      "Culto general",
      "Jóvenes",
      "ABC",
    ]);
    expect(await repos.records.list()).toHaveLength(10);
    expect((await repos.songs.list()).length).toBeGreaterThan(0);
  });

  it("returns copies, so callers can't mutate the store", async () => {
    const [song] = await repos.songs.list();
    song.title = "Cambiado";
    expect((await repos.songs.get(song.id))?.title).not.toBe("Cambiado");
  });

  it("creates, updates and deletes songs", async () => {
    const created = await repos.songs.create({
      title: "Nueva",
      author: "",
      sections: [{ label: null, text: "Hola" }],
    });
    await repos.songs.update(created.id, {
      title: "Editada",
      author: "Yo",
      sections: [{ label: "Coro", text: "Adiós" }],
    });
    expect((await repos.songs.get(created.id))?.sections[0]).toMatchObject({
      label: "Coro",
      text: "Adiós",
    });
    await repos.songs.delete(created.id);
    expect(await repos.songs.get(created.id)).toBeNull();
  });

  it("deleting a person clears it as suggested leader but keeps records", async () => {
    const [culto] = await repos.serviceTypes.list();
    const leaderId = culto.blocks[0].defaultPersonId!;
    await repos.people.delete(leaderId);

    expect((await repos.serviceTypes.get(culto.id))?.blocks[0].defaultPersonId).toBeNull();
    const stillReferenced = mockStore().records.some((r) =>
      r.blocks.some((b) => b.personId === leaderId),
    );
    expect(stillReferenced).toBe(true);
  });

  it("lists records most recent first", async () => {
    const dates = (await repos.records.list()).map((record) => record.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
});
