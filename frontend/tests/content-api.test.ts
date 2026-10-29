import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

process.env.NEXT_PUBLIC_API_BASE_URL = "http://127.0.0.1:4000/api/v1";
const { listClubs, saveClub } = await import("../app/lib/api/clubs");
const { listAgenda, saveAgendaItem, deleteAgendaItem } =
  await import("../app/lib/api/agenda");
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("uses public and admin endpoints without a demo fallback", async () => {
  const paths: string[] = [];
  globalThis.fetch = async (url, init) => {
    paths.push(String(url));
    assert.equal(init?.credentials, "include");
    return new Response("[]", {
      headers: { "Content-Type": "application/json" },
    });
  };
  assert.deepEqual(await listClubs(), []);
  await listClubs(true);
  await listAgenda();
  await listAgenda(true);
  assert.deepEqual(
    paths.map((path) => new URL(path).pathname),
    [
      "/api/v1/clubs",
      "/api/v1/admin/clubs",
      "/api/v1/agenda",
      "/api/v1/admin/agenda",
    ],
  );
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "Sesi berakhir" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  await assert.rejects(listClubs(true), /Sesi berakhir/);
  await assert.rejects(listAgenda(true), /Sesi berakhir/);
});

test("sends input-only payloads with correct mutation methods", async () => {
  const calls: { path: string; method?: string; body?: unknown }[] = [];
  globalThis.fetch = async (url, init) => {
    calls.push({
      path: new URL(String(url)).pathname,
      method: init?.method,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    return init?.method === "DELETE"
      ? new Response(null, { status: 204 })
      : new Response(
          JSON.stringify({ id: "test", ...JSON.parse(String(init?.body)) }),
          { headers: { "Content-Type": "application/json" } },
        );
  };
  const club = {
    name: "Pramuka",
    description: "Kegiatan siswa",
    active: false,
  };
  const agenda = {
    title: "Rapat sekolah",
    date: "2026-11-01",
    time: "08:00",
    location: "Aula",
    type: "Rapat" as const,
    completed: true,
    visibility: "Internal" as const,
  };
  await saveClub(club);
  await saveClub(club, "id/club");
  await saveAgendaItem(agenda);
  await saveAgendaItem(agenda, "agenda-1");
  await deleteAgendaItem("agenda-1");
  assert.deepEqual(
    calls.map((call) => call.method),
    ["POST", "PATCH", "POST", "PATCH", "DELETE"],
  );
  assert.equal(calls[1].path, "/api/v1/clubs/id%2Fclub");
  assert.deepEqual(calls[3].body, agenda);
  assert.equal((calls[0].body as Record<string, unknown>).id, undefined);
});

test("surfaces failed writes instead of reporting success", async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "Nama sudah digunakan" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  await assert.rejects(
    saveClub({ name: "Pramuka", description: "Kegiatan", active: true }),
    /Nama sudah digunakan/,
  );
  globalThis.fetch = async () => {
    throw new TypeError("Network unavailable");
  };
  await assert.rejects(deleteAgendaItem("agenda-1"), /Network unavailable/);
});
