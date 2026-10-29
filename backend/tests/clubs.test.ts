import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Club } from "../src/modules/clubs/club.schema.js";
import type { ClubRepository } from "../src/modules/clubs/club.repository.js";
import { registerClubRoutes } from "../src/modules/clubs/club.routes.js";
import { contentFixture, editorHeaders } from "./content-fixture.js";

const apps: FastifyInstance[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});
const input = { name: "Pramuka", description: "Kegiatan siswa", active: true };
async function setup(
  role: "editor" | "super_admin" | "admin_ppdb" | null = "editor",
) {
  const { app, guard } = await contentFixture(role);
  apps.push(app);
  const records: Club[] = [];
  const unique = (name: string, id?: string) => {
    if (
      records.some(
        (row) => row.id !== id && row.name.toLowerCase() === name.toLowerCase(),
      )
    )
      throw { cause: { code: "23505" } };
  };
  const repository: ClubRepository = {
    list: async (publicOnly) =>
      records.filter((row) => !publicOnly || row.active),
    create: async (value) => {
      unique(value.name);
      const row = { id: String(records.length + 1), ...value };
      records.push(row);
      return row;
    },
    update: async (id, value) => {
      const row = records.find((row) => row.id === id);
      if (!row) return undefined;
      if (value.name) unique(value.name, id);
      Object.assign(row, value);
      return row;
    },
  };
  await registerClubRoutes(app, repository, guard);
  return app;
}

describe("clubs", () => {
  it("creates, renames and deactivates without rewriting historical choices", async () => {
    const app = await setup();
    const historical = { extracurriculars: ["Pramuka"] };
    const created = await app.inject({
      method: "POST",
      url: "/clubs",
      headers: editorHeaders,
      payload: input,
    });
    expect(created.statusCode).toBe(201);
    expect((await app.inject("/clubs")).json()).toHaveLength(1);
    const updated = await app.inject({
      method: "PATCH",
      url: "/clubs/1",
      headers: editorHeaders,
      payload: { name: "Pramuka Muda", active: false },
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({
      id: "1",
      active: false,
      description: input.description,
    });
    expect((await app.inject("/clubs")).json()).toEqual([]);
    const admin = await app.inject({
      url: "/admin/clubs",
      headers: editorHeaders,
    });
    expect(admin.headers["cache-control"]).toBe("no-store");
    expect(admin.json()).toHaveLength(1);
    expect(historical.extracurriculars).toEqual(["Pramuka"]);
    expect(
      (
        await app.inject({
          method: "DELETE",
          url: "/clubs/1",
          headers: editorHeaders,
        })
      ).statusCode,
    ).toBe(404);
  });
  it("rejects duplicate names after trimming and case normalization, including inactive names", async () => {
    const app = await setup();
    await app.inject({
      method: "POST",
      url: "/clubs",
      headers: editorHeaders,
      payload: { ...input, active: false },
    });
    const response = await app.inject({
      method: "POST",
      url: "/clubs",
      headers: editorHeaders,
      payload: { ...input, name: "  PRAMUKA  " },
    });
    expect(response.statusCode).toBe(409);
  });
  it.each([
    { ...input, name: " " },
    { ...input, name: "Belum menentukan" },
    { ...input, description: " " },
    { ...input, active: "false" },
    { ...input, id: "extra" },
    { ...input, name: "x".repeat(81) },
  ])("rejects invalid input %j", async (payload) => {
    const app = await setup();
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/clubs",
          headers: editorHeaders,
          payload,
        })
      ).statusCode,
    ).toBe(422);
  });
  it("rejects empty patch and returns not found for missing IDs", async () => {
    const app = await setup();
    expect(
      (
        await app.inject({
          method: "PATCH",
          url: "/clubs/missing",
          headers: editorHeaders,
          payload: {},
        })
      ).statusCode,
    ).toBe(422);
    expect(
      (
        await app.inject({
          method: "PATCH",
          url: "/clubs/missing",
          headers: editorHeaders,
          payload: { active: false },
        })
      ).statusCode,
    ).toBe(404);
  });
  it.each(["editor", "super_admin"] as const)("allows %s", async (role) => {
    const app = await setup(role);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/clubs",
          headers: editorHeaders,
          payload: input,
        })
      ).statusCode,
    ).toBe(201);
  });
  it.each(["admin_ppdb", null] as const)(
    "denies unauthorized role/session %s",
    async (role) => {
      const app = await setup(role);
      for (const request of [
        { method: "GET" as const, url: "/admin/clubs" },
        { method: "POST" as const, url: "/clubs", payload: input },
      ]) {
        expect(
          (await app.inject({ ...request, headers: editorHeaders })).statusCode,
        ).toBe(role ? 403 : 401);
      }
    },
  );
  it("rejects missing cookies and untrusted/missing mutation Origin", async () => {
    const app = await setup();
    expect((await app.inject("/admin/clubs")).statusCode).toBe(401);
    for (const headers of [
      { cookie: editorHeaders.cookie },
      { ...editorHeaders, origin: "https://untrusted.example" },
    ]) {
      expect(
        (
          await app.inject({
            method: "POST",
            url: "/clubs",
            headers,
            payload: input,
          })
        ).statusCode,
      ).toBe(403);
    }
  });
});
