import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import type { AppConfig } from "../src/config/env.js";

const config: AppConfig = {
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: 4000,
  DATABASE_URL: "postgres://test:test@127.0.0.1:5432/test",
  FRONTEND_ORIGINS: ["http://localhost:3000"],
  SESSION_COOKIE_NAME: "test_session",
  SESSION_TTL_HOURS: 1,
  UPLOAD_DIR: "./uploads-test",
  MAX_UPLOAD_MB: 1,
  TRUST_PROXY: false,
};

const apps: Awaited<ReturnType<typeof buildApp>>[] = [];

async function createApp() {
  const app = await buildApp(config);
  apps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("achievements module", () => {
  it("requires an admin session to list all achievements", async () => {
    const app = await createApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/admin/achievements",
    });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires an admin session to create an achievement", async () => {
    const app = await createApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/achievements",
      payload: {},
    });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires an admin session to update an achievement", async () => {
    const app = await createApp();
    const response = await app.inject({
      method: "PATCH",
      url: "/api/v1/achievements/example",
      payload: { published: true },
    });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires an admin session to delete an achievement", async () => {
    const app = await createApp();
    const response = await app.inject({
      method: "DELETE",
      url: "/api/v1/achievements/example",
    });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "UNAUTHORIZED" });
  });

  it.each(["PATCH", "DELETE"])("allows browser preflight for %s", async (method) => {
    const app = await createApp();
    const response = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/achievements/example",
      headers: {
        origin: "http://localhost:3000",
        "access-control-request-method": method,
        "access-control-request-headers": "content-type",
      },
    });
    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-methods"]).toContain(method);
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });
});