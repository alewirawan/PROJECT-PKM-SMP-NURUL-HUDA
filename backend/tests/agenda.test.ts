import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type {
  Agenda,
  AgendaInput,
} from "../src/modules/agenda/agenda.schema.js";
import type { AgendaRepository } from "../src/modules/agenda/agenda.repository.js";
import { registerAgendaRoutes } from "../src/modules/agenda/agenda.routes.js";
import { contentFixture, editorHeaders } from "./content-fixture.js";

const apps: FastifyInstance[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});
const input: AgendaInput = {
  title: "Open house",
  date: "2026-10-30",
  time: "08:30",
  location: "Aula sekolah",
  type: "Kegiatan",
  completed: false,
  visibility: "Internal",
};
async function setup(
  role: "editor" | "super_admin" | "admin_ppdb" | null = "editor",
) {
  const { app, guard } = await contentFixture(role);
  apps.push(app);
  const records: Agenda[] = [];
  const repository: AgendaRepository = {
    list: async (publicOnly) =>
      records
        .filter((row) => !publicOnly || row.visibility === "Publik")
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    create: async (value) => {
      const row = { id: String(records.length + 1), ...value };
      records.push(row);
      return row;
    },
    update: async (id, value) => {
      const row = records.find((row) => row.id === id);
      if (row) Object.assign(row, value);
      return row;
    },
    remove: async (id) => {
      const index = records.findIndex((row) => row.id === id);
      if (index < 0) return false;
      records.splice(index, 1);
      return true;
    },
  };
  await registerAgendaRoutes(app, repository, guard);
  return app;
}

describe("agenda", () => {
  it("keeps internal agenda private, publishes, edits, completes and deletes", async () => {
    const app = await setup();
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/agenda",
          headers: editorHeaders,
          payload: input,
        })
      ).statusCode,
    ).toBe(201);
    expect((await app.inject("/agenda")).json()).toEqual([]);
    expect(
      (
        await app.inject({ url: "/admin/agenda", headers: editorHeaders })
      ).json(),
    ).toHaveLength(1);
    const edited = await app.inject({
      method: "PATCH",
      url: "/agenda/1",
      headers: editorHeaders,
      payload: { ...input, visibility: "Publik", completed: true },
    });
    expect(edited.statusCode).toBe(200);
    expect((await app.inject("/agenda")).json()).toMatchObject([
      { visibility: "Publik", completed: true },
    ]);
    await app.inject({
      method: "PATCH",
      url: "/agenda/1",
      headers: editorHeaders,
      payload: input,
    });
    expect((await app.inject("/agenda")).json()).toEqual([]);
    expect(
      (
        await app.inject({
          method: "DELETE",
          url: "/agenda/1",
          headers: editorHeaders,
        })
      ).statusCode,
    ).toBe(204);
    expect(
      (
        await app.inject({
          method: "DELETE",
          url: "/agenda/1",
          headers: editorHeaders,
        })
      ).statusCode,
    ).toBe(404);
  });
  it.each([
    { ...input, date: "2026-02-30" },
    { ...input, time: "25:00" },
    { ...input, visibility: undefined },
    { ...input, visibility: "private" },
    { ...input, title: " " },
    { ...input, location: " " },
    { ...input, completed: "true" },
    { ...input, type: "Lainnya" },
  ])("rejects invalid agenda %j", async (payload) => {
    const app = await setup();
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/agenda",
          headers: editorHeaders,
          payload,
        })
      ).statusCode,
    ).toBe(422);
  });
  it("requires full update and reports missing agenda", async () => {
    const app = await setup();
    expect(
      (
        await app.inject({
          method: "PATCH",
          url: "/agenda/missing",
          headers: editorHeaders,
          payload: { completed: true },
        })
      ).statusCode,
    ).toBe(422);
    expect(
      (
        await app.inject({
          method: "PATCH",
          url: "/agenda/missing",
          headers: editorHeaders,
          payload: input,
        })
      ).statusCode,
    ).toBe(404);
  });
  it.each(["admin_ppdb", null] as const)(
    "protects admin listing and mutations for %s",
    async (role) => {
      const app = await setup(role);
      for (const request of [
        { method: "GET" as const, url: "/admin/agenda" },
        { method: "POST" as const, url: "/agenda", payload: input },
        { method: "PATCH" as const, url: "/agenda/1", payload: input },
        { method: "DELETE" as const, url: "/agenda/1" },
      ]) {
        expect(
          (await app.inject({ ...request, headers: editorHeaders })).statusCode,
        ).toBe(role ? 403 : 401);
      }
      expect((await app.inject("/agenda")).statusCode).toBe(200);
    },
  );
});
