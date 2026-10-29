import { createHash } from "node:crypto";
import type { FastifyRequest } from "fastify";
import type { AppConfig } from "../../config/env.js";
import { AppError, UnauthorizedError } from "../../shared/errors/app-error.js";
import type { AuthRepository } from "./auth.repository.js";

export function createContentGuard(
  repository: AuthRepository,
  config: AppConfig,
) {
  return async (request: FastifyRequest) => {
    const token = request.cookies[config.SESSION_COOKIE_NAME];
    if (!token) throw new UnauthorizedError();
    const session = await repository.findValidSession(
      createHash("sha256").update(token).digest("hex"),
    );
    if (!session) throw new UnauthorizedError();
    if (!["super_admin", "editor"].includes(session.role)) {
      throw new AppError(
        "Akun tidak memiliki izin mengelola konten.",
        403,
        "FORBIDDEN",
      );
    }
    if (
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
  };
}
