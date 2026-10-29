import Fastify from "fastify";
import cookie from "@fastify/cookie";
import type { AppConfig } from "../src/config/env.js";
import { createContentGuard } from "../src/modules/auth/auth.guard.js";
import type { AuthRepository } from "../src/modules/auth/auth.repository.js";
import { registerErrorHandlers } from "../src/shared/http/error-handler.js";

export const testConfig: AppConfig = {
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
export const editorHeaders = {
  cookie: "test_session=test-token",
  origin: "http://localhost:3000",
};

export async function contentFixture(
  role: "editor" | "super_admin" | "admin_ppdb" | null = "editor",
) {
  const app = Fastify();
  await app.register(cookie);
  registerErrorHandlers(app);
  const auth: AuthRepository = {
    findAdminByEmail: async () => undefined,
    createSession: async () => {},
    deleteSession: async () => {},
    findValidSession: async () =>
      role
        ? {
            tokenHash: "test-hash",
            adminId: "test-admin",
            displayName: "Admin Contoh",
            role,
            expiresAt: new Date(Date.now() + 1000),
          }
        : undefined,
  };
  return { app, guard: createContentGuard(auth, testConfig) };
}
