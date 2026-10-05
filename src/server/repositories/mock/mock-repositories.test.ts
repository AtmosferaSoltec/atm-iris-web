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

  it("deleting a person clears it as suggested leader but keeps records", async () => {
    const { repos, session } = await signedIn();
    const culto = (await repos.serviceTypes.list()).find((t) => t.name === "Culto general")!;
    const leaderId = culto.blocks[0].defaultPersonId!;
    await repos.people.delete(leaderId);

    expect((await repos.serviceTypes.get(culto.id))?.blocks[0].defaultPersonId).toBeNull();
    const church = mockWorld().churches.find((data) => data.church.id === session.church.id)!;
    expect(church.records.some((r) => r.blocks.some((b) => b.personId === leaderId))).toBe(true);
    expect(session.church.id).toBe(MOCK_IDS.vidaNueva);
  });
});
