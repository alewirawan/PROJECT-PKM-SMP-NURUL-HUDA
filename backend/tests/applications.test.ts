import cookie from "@fastify/cookie";
import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApplicationsReadGuard } from "../src/modules/auth/auth.guard.js";
import type { AuthRepository } from "../src/modules/auth/auth.repository.js";
import type {
  ApplicationListRecord,
  ApplicationsRepository,
} from "../src/modules/applications/application.repository.js";
import {
  encodeApplicationCursor,
  type ApplicationListQuery,
} from "../src/modules/applications/application.schema.js";
import { registerApplicationsRoutes } from "../src/modules/applications/application.routes.js";
import { createApplicationsService } from "../src/modules/applications/application.service.js";
import { testConfig } from "./content-fixture.js";

type Role = "super_admin" | "admin_ppdb" | "editor" | null;
const apps: ReturnType<typeof Fastify>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

async function setup(role: Role = "super_admin") {
  const app = Fastify();
  apps.push(app);
  await app.register(cookie);
  const authRepository: AuthRepository = {
    findAdminByEmail: async () => undefined,
    createSession: async () => {},
    deleteSession: async () => {},
    findValidSession: async () =>
      role
        ? {
            tokenHash: "test-hash",
            adminId: "test-admin",
            displayName: "Admin Pengujian",
            role,
            expiresAt: new Date(Date.now() + 60_000),
          }
        : undefined,
  };
  const list = vi.fn(async (query: ApplicationListQuery) => {
    expect(query.limit).toBeGreaterThanOrEqual(1);
    return { items: [], nextCursor: null };
  });
  const repository: ApplicationsRepository = { list };
  await app.register(
    async (api) => {
      await registerApplicationsRoutes(
        api,
        repository,
        createApplicationsReadGuard(authRepository, testConfig),
      );
    },
    { prefix: "/api/v1" },
  );
  return { app, list };
}

describe("GET /api/v1/applications", () => {
  it.each(["super_admin", "admin_ppdb"] as const)(
    "returns an empty page for an authorized %s when there are no records",
    async (role) => {
      const { app } = await setup(role);
      const response = await app.inject({
        url: "/api/v1/applications",
        headers: { cookie: "test_session=test-token" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["cache-control"]).toBe("no-store");
      expect(response.json()).toEqual({ items: [], nextCursor: null });
    },
  );

  it("requires an authenticated session", async () => {
    const { app } = await setup(null);
    const response = await app.inject("/api/v1/applications");

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects roles without PPDB access", async () => {
    const { app } = await setup("editor");
    const response = await app.inject({
      url: "/api/v1/applications",
      headers: { cookie: "test_session=test-token" },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: "FORBIDDEN" });
  });

  it("validates filters and applies the default page size", async () => {
    const { app, list } = await setup();
    const cursor = encodeApplicationCursor({
      submittedAt: "2026-11-12T10:00:00.123456Z",
      registrationNumber: "NH-2026-42",
    });
    const response = await app.inject({
      url: `/api/v1/applications?q=${encodeURIComponent("Nayara")}&source=Website&status=Verifikasi&documents=Lengkap&cursor=${cursor}`,
      headers: { cookie: "test_session=test-token" },
    });

    expect(response.statusCode).toBe(200);
    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({
        q: "Nayara",
        source: "Website",
        status: "Verifikasi",
        documents: "Lengkap",
        cursor: {
          submittedAt: "2026-11-12T10:00:00.123456Z",
          registrationNumber: "NH-2026-42",
        },
        limit: 25,
      }),
    );
  });

  it.each([
    "?source=unknown",
    "?status=accepted",
    "?documents=maybe",
    "?limit=101",
    "?unexpected=value",
    "?cursor=not-a-cursor",
  ])("returns a validation error for invalid query %s", async (query) => {
    const { app } = await setup();
    const response = await app.inject({
      url: `/api/v1/applications${query}`,
      headers: { cookie: "test_session=test-token" },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" });
  });
});

describe("application response mapping", () => {
  const record: ApplicationListRecord = {
    id: "00000000-0000-4000-8000-000000000001",
    registrationNumber: "NH-2026-42",
    schemaVersion: 2,
    studentName: "Siswa Contoh",
    nisn: "0000000000",
    originSchool: "SD Contoh",
    birthPlace: "Bandung",
    birthDate: new Date("2013-01-02T00:00:00.000Z"),
    gender: "Perempuan",
    address: "Alamat contoh",
    parentName: "Wali Contoh",
    parentOccupation: null,
    phone: "08000000000",
    email: "wali@example.test",
    documentRequirements: {
      requiredKinds: ["kk"],
      requireOneGraduationDocument: false,
    },
    status: "verified",
    source: "website",
    reEnrollmentStatus: null,
    notes: null,
    submittedAt: new Date("2026-11-12T10:00:00.000Z"),
    cursorSubmittedAt: "2026-11-12T10:00:00.000000Z",
    extracurriculars: ["Pramuka"],
    documents: [
      {
        id: "00000000-0000-4000-8000-000000000002",
        applicationId: "00000000-0000-4000-8000-000000000001",
        kind: "kk",
        status: "verified",
        receivedPhysically: true,
        reviewNote: null,
        reviewedAt: new Date("2026-11-12T10:30:00.000Z"),
        currentVersion: {
          originalName: "kk.pdf",
          mimeType: "application/pdf",
          fileSize: 1024,
          uploadedAt: new Date("2026-11-12T10:15:00.000Z"),
        },
      },
    ],
  };

  it("maps database enums and relations without exposing storage metadata", async () => {
    const repository: ApplicationsRepository = {
      list: async () => ({ items: [record], nextCursor: null }),
    };
    const page = await createApplicationsService(repository).list({});

    expect(page.items[0]).toMatchObject({
      id: "NH-2026-42",
      source: "Website",
      status: "Terverifikasi",
      extracurriculars: ["Pramuka"],
      documents: [
        {
          id: "00000000-0000-4000-8000-000000000002",
          kind: "kk",
          status: "Terverifikasi",
          hasFile: true,
          fileName: "kk.pdf",
          size: 1024,
        },
      ],
    });
    expect(JSON.stringify(page)).not.toContain("storageKey");
    expect(JSON.stringify(page)).not.toContain("applicationId");
    expect(page.items[0]?.reEnrollmentStatus).toBeNull();
  });

  it("returns persisted re-enrollment status for dashboard refreshes", async () => {
    const repository: ApplicationsRepository = {
      list: async () => ({
        items: [{ ...record, reEnrollmentStatus: "completed" }],
        nextCursor: null,
      }),
    };

    const page = await createApplicationsService(repository).list({});

    expect(page.items[0]?.reEnrollmentStatus).toBe("completed");
  });

  it("does not fabricate contract fields for an unverified legacy record", async () => {
    const repository: ApplicationsRepository = {
      list: async () => ({
        items: [{ ...record, schemaVersion: 1 }],
        nextCursor: null,
      }),
    };

    await expect(
      createApplicationsService(repository).list({}),
    ).rejects.toMatchObject({ statusCode: 409, code: "CONFLICT" });
  });
});
