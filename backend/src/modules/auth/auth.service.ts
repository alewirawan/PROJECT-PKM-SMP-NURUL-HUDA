import { createHash, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { UnauthorizedError } from "../../shared/errors/app-error.js";
import type { AuthRepository } from "./auth.repository.js";

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createAuthService(
  repository: AuthRepository,
  ttlHours: number,
) {
  const dummyPasswordHash = hash("not-a-real-admin-password");

  return {
    async login(input: {
      email: string;
      password: string;
      ipAddress?: string;
      userAgent?: string;
    }) {
      const email = input.email.trim().toLowerCase();
      const admin = await repository.findAdminByEmail(email);
      const passwordHash = admin?.passwordHash ?? (await dummyPasswordHash);
      const passwordValid = await verify(passwordHash, input.password);

      if (!admin || !passwordValid) {
        throw new UnauthorizedError("Email atau password tidak sesuai.");
      }

      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
      await repository.createSession({
        tokenHash: hashSessionToken(token),
        adminId: admin.id,
        expiresAt,
        ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
        ...(input.userAgent ? { userAgent: input.userAgent } : {}),
      });

      return {
        token,
        expiresAt,
      };
    },

    async getSession(token?: string) {
      if (!token) throw new UnauthorizedError();
      const session = await repository.findValidSession(
        hashSessionToken(token),
      );
      if (!session) throw new UnauthorizedError();
      return {
        user: {
          id: session.adminId,
          name: session.displayName,
          role: session.role,
        },
        expiresAt: session.expiresAt,
      };
    },

    async logout(token?: string) {
      if (token) await repository.deleteSession(hashSessionToken(token));
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
