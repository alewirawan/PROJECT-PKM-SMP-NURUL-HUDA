import cookie from "@fastify/cookie";
import Fastify from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import type { AppConfig } from "../src/config/env.js";
import { createDashboardReadGuard } from "../src/modules/auth/auth.guard.js";
import type { AuthRepository } from "../src/modules/auth/auth.repository.js";
import type { DashboardRepository } from "../src/modules/dashboard/dashboard.repository.js";
import { registerDashboardRoutes } from "../src/modules/dashboard/dashboard.routes.js";
import { registerErrorHandlers } from "../src/shared/http/error-handler.js";

const config: AppConfig = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: 4000,
  DATABASE_URL: "postgres://localhost:65439/team2_test",
  FRONTEND_ORIGINS: ["http://localhost:3000"],
  SESSION_COOKIE_NAME: "test_session",
  SESSION_TTL_HOURS: 1,
  UPLOAD_DIR: "./uploads-test",
  MAX_UPLOAD_MB: 1,
  TRUST_PROXY: false,
};

const summary = {
  students: { count: 5, status: "available" },
  teachers: { count: 8, status: "available" },
  ppdbApplicants: { count: 12, status: "available" },
  agenda: { count: 4, status: "available" },
} as const;

const apps: ReturnType<typeof Fastify>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

async function setup(role: "super_admin" | "admin_ppdb" | "editor" | null) {
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
  const dashboardRepository: DashboardRepository = {
    summary: async () => summary,
  };
  await app.register(
    async (api) => {
      await registerDashboardRoutes(
        api,
        dashboardRepository,
        createDashboardReadGuard(authRepository, config),
      );
    },
    { prefix: "/api/v1" },
  );
  return app;
}

describe("admin dashboard summary", () => {
  it.each(["super_admin", "admin_ppdb"] as const)(
    "returns the dashboard summary for %s",
    async (role) => {
      const app = await setup(role);
      const response = await app.inject({
        url: "/api/v1/admin/dashboard/summary",
        headers: { cookie: "test_session=test-token" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["cache-control"]).toBe("no-store");
      expect(response.json()).toEqual(summary);
    },
  );

  it("requires an authenticated session", async () => {
    const app = await setup(null);
    const response = await app.inject("/api/v1/admin/dashboard/summary");

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects the editor role", async () => {
    const app = await setup("editor");
    const response = await app.inject({
      url: "/api/v1/admin/dashboard/summary",
      headers: { cookie: "test_session=test-token" },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: "FORBIDDEN" });
  });
});
