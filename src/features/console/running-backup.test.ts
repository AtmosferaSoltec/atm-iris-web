import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceRecord } from "@/domain/models";
import type { ServiceRecordInput } from "@/server/repositories/types";
import { newestRunning, writeBackup } from "./running-backup";

const input: ServiceRecordInput = {
  status: "inProgress",
  date: "2026-10-19T15:00:00.000Z",
  serviceTypeId: "culto",
  serviceTypeName: "Culto general",
  blocks: [
    {
      id: "b1",
      name: "Bienvenida",
      plannedSeconds: 600,
      actualSeconds: 0,
      personId: null,
      personName: null,
      status: "running",
      startedAt: "2026-10-19T15:00:00.000Z",
      endedAt: null,
    },
  ],
};
const fromApi = (id: string, updatedAt: string): ServiceRecord => ({
  id,
  ...input,
  createdAt: updatedAt,
  updatedAt,
});

describe("running backup", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T15:05:00.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const twoBlocks: ServiceRecordInput = {
    ...input,
    blocks: [
      { ...input.blocks[0], status: "completed", endedAt: "2026-10-19T15:04:00.000Z" },
      { ...input.blocks[0], id: "b2", name: "Mensaje", startedAt: "2026-10-19T15:04:00.000Z" },
    ],
  };

  it("keeps a change the API never got (left the page right after it), whatever the clocks say", () => {
    writeBackup("c1", "r1", twoBlocks);
    expect(newestRunning("c1", null)?.blocks).toHaveLength(2);
    // The API's copy says it was saved later, but it is behind: one block running.
    const behind = fromApi("r1", "2030-01-01T00:00:00.000Z");
    expect(newestRunning("c1", behind)?.blocks[1].status).toBe("running");
    expect(newestRunning("c1", behind)?.blocks[0].status).toBe("completed");
  });

  it("prefers the API when another console moved it further or started another service", () => {
    writeBackup("c1", "r1", input);
    const further = { ...fromApi("r1", "2026-10-19T15:01:00.000Z"), blocks: twoBlocks.blocks };
    expect(newestRunning("c1", further)).toBe(further);
    const other = fromApi("r2", "2026-10-19T15:01:00.000Z");
    expect(newestRunning("c1", other)).toBe(other);
  });

  it("forgets a finished service", () => {
    writeBackup("c1", "r1", input);
    writeBackup("c1", "r1", { ...input, status: "finished" });
    expect(newestRunning("c1", null)).toBeNull();
  });
});
