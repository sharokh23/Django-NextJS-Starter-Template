import { afterEach, describe, expect, it, vi } from "vitest";

import { BACKEND_BASE, fetchJson } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BACKEND_BASE", () => {
  it("defaults to the same-origin /svc/api prefix", () => {
    expect(BACKEND_BASE).toBe("/svc/api");
  });
});

describe("fetchJson", () => {
  it("returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
        ),
    );
    await expect(fetchJson("/svc/api/health")).resolves.toEqual({
      status: "ok",
    });
  });

  it("throws with the status code on non-2xx responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 502 })),
    );
    await expect(fetchJson("/svc/api/health")).rejects.toThrow("502");
  });
});
