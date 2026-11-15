import { createHash } from "node:crypto";
import type { FastifyRequest } from "fastify";
import type { AppConfig } from "../../config/env.js";
import { AppError, UnauthorizedError } from "../../shared/errors/app-error.js";
import type { AuthRepository } from "./auth.repository.js";

declare module "fastify" {
  interface FastifyRequest {
    adminId: string | null;
  }
}

export function createContentGuard(
  repository: AuthRepository,
  config: AppConfig,
) {
  return createRoleGuard(
    repository,
    config,
    ["super_admin", "editor"],
    "Akun tidak memiliki izin mengelola konten.",
    true,
  );
}

export function createDashboardReadGuard(
  repository: AuthRepository,
  config: AppConfig,
) {
  return createRoleGuard(
    repository,
    config,
    ["super_admin", "admin_ppdb"],
    "Akun tidak memiliki izin melihat ringkasan dashboard.",
    false,
  );
}

export function createApplicationsReadGuard(
  repository: AuthRepository,
  config: AppConfig,
) {
  return createRoleGuard(
    repository,
    config,
    ["super_admin", "admin_ppdb"],
    "Akun tidak memiliki izin melihat data pendaftar PPDB.",
    false,
  );
}

export function createStudentsReadGuard(
  repository: AuthRepository,
  config: AppConfig,
) {
  return createRoleGuard(
    repository,
    config,
    ["super_admin", "admin_ppdb"],
    "Akun tidak memiliki izin melihat data siswa.",
    false,
  );
}

export function createApplicationsWriteGuard(
  repository: AuthRepository,
  config: AppConfig,
) {
  return createRoleGuard(
    repository,
    config,
    ["super_admin", "admin_ppdb"],
    "Akun tidak memiliki izin mengelola penerimaan PPDB.",
    true,
    true,
  );
}

export function createSettingsWriteGuard(
  repository: AuthRepository,
  config: AppConfig,
) {
  return createRoleGuard(
    repository,
    config,
    ["super_admin"],
    "Hanya super admin yang dapat mengubah pengaturan sekolah.",
    true,
  );
}

function createRoleGuard(
  repository: AuthRepository,
  config: AppConfig,
  allowedRoles: readonly ("super_admin" | "admin_ppdb" | "editor")[],
  forbiddenMessage: string,
  requireTrustedOriginForWrites: boolean,
  captureAdminId = false,
) {
  return async (request: FastifyRequest) => {
    const token = request.cookies[config.SESSION_COOKIE_NAME];
    if (!token) throw new UnauthorizedError();
    const session = await repository.findValidSession(
      createHash("sha256").update(token).digest("hex"),
    );
    if (!session) throw new UnauthorizedError();
    if (!allowedRoles.includes(session.role))
      throw new AppError(forbiddenMessage, 403, "FORBIDDEN");
    if (
      requireTrustedOriginForWrites &&
      !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
      (!request.headers.origin ||
        !config.FRONTEND_ORIGINS.includes(request.headers.origin))
    ) {
      throw new AppError(
        "Origin permintaan tidak diizinkan.",
        403,
        "FORBIDDEN",
      );
    }
    if (captureAdminId) request.adminId = session.adminId;
  };
}
