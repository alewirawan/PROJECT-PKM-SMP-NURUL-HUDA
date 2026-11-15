import cookie from "@fastify/cookie";
import Fastify from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { createSettingsWriteGuard } from "../src/modules/auth/auth.guard.js";
import type { AuthRepository } from "../src/modules/auth/auth.repository.js";
import type { SettingsRepository } from "../src/modules/settings/settings.repository.js";
import { registerSettingsRoutes } from "../src/modules/settings/settings.routes.js";
import type { SchoolSettingsInput } from "../src/modules/settings/settings.schema.js";
import { registerErrorHandlers } from "../src/shared/http/error-handler.js";
import { testConfig } from "./content-fixture.js";

const apps: ReturnType<typeof Fastify>[] = [];
const settings: SchoolSettingsInput = {
  schoolName: "SMP Nurul Huda",
  tagline: "Belajar, tumbuh, dan berkarya.",
  email: "sekolah@example.test",
  ppdbEmail: "ppdb@example.test",
  phone: "0800000000",
  whatsapp: "0800000000",
  address: "Alamat contoh sekolah untuk pengujian.",
  academicYear: "2026/2027",
  registrationOpen: true,
  documentRequirements: {
    requiredKinds: ["kk", "ktp", "akta"],
    requireOneGraduationDocument: true,
  },
  registrationOpensAt: null,
  registrationClosesAt: null,
  dataRetention: "indefinite",
};

async function setup(role: "super_admin" | "admin_ppdb" | null = null) {
  const app = Fastify();
  apps.push(app);
  await app.register(cookie);
  registerErrorHandlers(app);
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
  const repository: SettingsRepository = {
    get: async () => settings,
    save: async (value) => value,
  };
  await app.register(
    async (api) => {
      await registerSettingsRoutes(
        api,
        repository,
        createSettingsWriteGuard(authRepository, testConfig),
      );
    },
    { prefix: "/api/v1" },
  );
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("/api/v1/settings", () => {
  it("exposes current registration status and requirements publicly", async () => {
    const app = await setup();
    const response = await app.inject("/api/v1/settings");

    expect(response.statusCode).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.json()).toMatchObject({
      registrationOpen: true,
      documentRequirements: settings.documentRequirements,
      dataRetention: "indefinite",
    });
  });

  it("restricts setting updates to super admins from trusted origins", async () => {
    const app = await setup("admin_ppdb");
    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/settings",
      headers: {
        cookie: "test_session=test-token",
        origin: "http://localhost:3000",
      },
      payload: settings,
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: "FORBIDDEN" });
  });

  it("validates settings before persisting them", async () => {
    const app = await setup("super_admin");
    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/settings",
      headers: {
        cookie: "test_session=test-token",
        origin: "http://localhost:3000",
      },
      payload: { ...settings, academicYear: "2026/2028" },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("saves settings for an authenticated super admin", async () => {
    const app = await setup("super_admin");
    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/settings",
      headers: {
        cookie: "test_session=test-token",
        origin: "http://localhost:3000",
      },
      payload: settings,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject(settings);
  });
});
