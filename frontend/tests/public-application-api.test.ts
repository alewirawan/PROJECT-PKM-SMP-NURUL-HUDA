import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

process.env.NEXT_PUBLIC_API_BASE_URL = "http://127.0.0.1:4000/api/v1";
const { ApiError } = await import("../app/lib/api-client");
const { submitPublicApplication } =
  await import("../app/lib/api/applications");
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const data = {
  studentName: "Siswa Uji",
  nisn: "0000000000",
  originSchool: "SD Contoh",
  birthPlace: "Kota Contoh",
  birthDate: "2013-01-02",
  gender: "Perempuan" as const,
  address: "Alamat contoh",
  parentName: "Wali Uji",
  parentOccupation: "",
  phone: "0800000000",
  email: "wali@example.test",
  extracurriculars: ["Pramuka"],
};

test("sends public PPDB fields and files with the stable idempotency key", async () => {
  const file = new File(["%PDF-1.7"], "kk.pdf", {
    type: "application/pdf",
  });
  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  globalThis.fetch = async (url, init) => {
    requestUrl = String(url);
    requestInit = init;
    return new Response(
      JSON.stringify({
        id: "NH-2026-AB12",
        status: "Verifikasi",
        submittedAt: "2026-11-15T12:00:00.000Z",
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  };

  const receipt = await submitPublicApplication(data, { kk: file }, crypto.randomUUID());

  assert.equal(new URL(requestUrl).pathname, "/api/v1/applications");
  assert.equal(requestInit?.method, "POST");
  assert.equal(requestInit?.credentials, "include");
  assert.equal(
    new Headers(requestInit?.headers).get("Idempotency-Key") !== null,
    true,
  );
  assert.ok(requestInit?.body instanceof FormData);
  const formData = requestInit.body as FormData;
  const jsonPart = formData.get("data");
  assert.ok(jsonPart instanceof File);
  assert.equal(jsonPart.type, "application/json");
  assert.deepEqual(JSON.parse(await jsonPart.text()), data);
  assert.equal((formData.get("kk") as File).name, "kk.pdf");
  assert.deepEqual(receipt, {
    id: "NH-2026-AB12",
    status: "Verifikasi",
    submittedAt: "2026-11-15T12:00:00.000Z",
  });
});

test("surfaces public submission conflicts instead of reporting success", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ message: "Kunci pengiriman tidak cocok." }),
      {
        status: 409,
        headers: { "Content-Type": "application/json" },
      },
    );

  await assert.rejects(
    submitPublicApplication(data, {}, crypto.randomUUID()),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 409);
      assert.match(error.message, /Kunci pengiriman/);
      return true;
    },
  );
});
