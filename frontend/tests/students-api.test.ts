import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

process.env.NEXT_PUBLIC_API_BASE_URL = "http://127.0.0.1:4000/api/v1";
const { ApiError } = await import("../app/lib/api-client");
const {
  acceptApplication,
  completeReEnrollment,
  listApplications,
} =
  await import("../app/lib/api/applications");
const { getStudent, listStudents } = await import("../app/lib/api/students");
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const listPage = {
  items: [
    {
      id: "c2d4d8c0-4df1-4f98-9207-4eeff0b46a25",
      studentName: "Siswa API",
      status: "active",
      officiallyRegisteredAt: "2026-11-12T10:00:00.000Z",
    },
  ],
  pagination: { page: 2, limit: 10, total: 11, totalPages: 2 },
};

test("lists students with server-side search, status, and pagination", async () => {
  let requestedUrl = "";
  globalThis.fetch = async (url, init) => {
    requestedUrl = String(url);
    assert.equal(init?.credentials, "include");
    return new Response(JSON.stringify(listPage), {
      headers: { "Content-Type": "application/json" },
    });
  };

  const result = await listStudents({
    q: "  Siswa API ",
    status: "active",
    page: 2,
    limit: 10,
  });

  const url = new URL(requestedUrl);
  assert.equal(url.pathname, "/api/v1/students/");
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    q: "Siswa API",
    status: "active",
    page: "2",
    limit: "10",
  });
  assert.equal(result.pagination.total, 11);
  assert.equal(result.items[0].id, listPage.items[0].id);
});

test("loads detail by the PostgreSQL student UUID", async () => {
  const student = {
    ...listPage.items[0],
    nisn: "0000000000",
    birthPlace: "Bandung",
    birthDate: "2013-01-02",
    gender: "Perempuan",
    address: "Alamat uji",
    createdAt: "2026-11-12T10:00:00.000Z",
    updatedAt: "2026-11-12T10:00:00.000Z",
  };
  let requestedUrl = "";
  globalThis.fetch = async (url, init) => {
    requestedUrl = String(url);
    assert.equal(init?.credentials, "include");
    return new Response(JSON.stringify(student), {
      headers: { "Content-Type": "application/json" },
    });
  };

  const result = await getStudent(student.id);

  assert.equal(
    new URL(requestedUrl).pathname,
    `/api/v1/students/${student.id}`,
  );
  assert.equal(result.nisn, student.nisn);
  assert.equal(result.id, student.id);
});

test("reads re-enrollment status from the applications API", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        items: [
          {
            studentName: "Siswa API",
            nisn: "0000000000",
            originSchool: "SD Contoh",
            birthPlace: "Bandung",
            birthDate: "2013-01-02",
            gender: "Perempuan",
            address: "Alamat uji",
            parentName: "Wali",
            phone: "0800000000",
            email: "wali@example.test",
            id: "NH-2026-42",
            source: "Website",
            status: "Diterima",
            reEnrollmentStatus: "completed",
            submittedAt: "2026-11-12T10:00:00.000Z",
            documents: [],
            extracurriculars: [],
          },
        ],
        nextCursor: null,
      }),
      { headers: { "Content-Type": "application/json" } },
    );

  const applications = await listApplications();

  assert.equal(applications[0]?.reEnrollmentStatus, "completed");
});

test("uses the public NH registration number for PPDB mutations", async () => {
  const calls: { url: string; method?: string; credentials?: RequestCredentials }[] =
    [];
  globalThis.fetch = async (url, init) => {
    calls.push({
      url: String(url),
      method: init?.method,
      credentials: init?.credentials,
    });
    const body =
      init?.method === "POST" &&
      String(url).includes("complete-re-enrollment")
        ? {
            student: {
              id: listPage.items[0].id,
              studentName: "Siswa API",
              status: "active",
              officiallyRegisteredAt: "2026-11-12T10:00:00.000Z",
            },
            reEnrollment: {
              status: "completed",
              confirmedAt: "2026-11-12T10:00:00.000Z",
            },
          }
        : { applicationId: "NH-2026-42", status: "accepted", changed: true };
    return new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json" },
    });
  };

  await acceptApplication("NH-2026-42");
  const result = await completeReEnrollment("NH-2026-42");

  assert.deepEqual(
    calls.map((call) => ({
      path: new URL(call.url).pathname,
      method: call.method,
      credentials: call.credentials,
    })),
    [
      {
        path: "/api/v1/applications/NH-2026-42/accept",
        method: "POST",
        credentials: "include",
      },
      {
        path: "/api/v1/applications/NH-2026-42/complete-re-enrollment",
        method: "POST",
        credentials: "include",
      },
    ],
  );
  assert.equal(result.reEnrollment.status, "completed");
  assert.equal(result.student.id, listPage.items[0].id);
});

test("surfaces authentication and workflow conflict errors", async () => {
  for (const [status, message] of [
    [401, "Sesi berakhir"],
    [403, "Tidak diizinkan"],
    [404, "Pendaftar tidak ditemukan"],
    [409, "Status pendaftar berubah"],
  ] as const) {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ message }), {
        status,
        headers: { "Content-Type": "application/json" },
      });

    await assert.rejects(acceptApplication("NH-2026-42"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, status);
      assert.match(error.message, new RegExp(message));
      return true;
    });
  }
});

test("rejects malformed student API responses", async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ items: [], pagination: { page: "1" } }), {
      headers: { "Content-Type": "application/json" },
    });

  await assert.rejects(listStudents(), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 502);
    return true;
  });
});
