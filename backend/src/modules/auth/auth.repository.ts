import { and, eq, gt } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import { adminSessions, admins } from "../../db/schema/index.js";

export function createAuthRepository(db: Database) {
  return {
    async findAdminByEmail(email: string) {
      return db.query.admins.findFirst({
        where: and(eq(admins.email, email), eq(admins.active, true)),
      });
    },

    async createSession(input: {
      tokenHash: string;
      adminId: string;
      expiresAt: Date;
      ipAddress?: string;
      userAgent?: string;
    }) {
      await db.insert(adminSessions).values(input);
    },

    async findValidSession(tokenHash: string) {
      const [record] = await db
        .select({
          tokenHash: adminSessions.tokenHash,
          expiresAt: adminSessions.expiresAt,
          adminId: admins.id,
          displayName: admins.displayName,
          role: admins.role,
        })
        .from(adminSessions)
        .innerJoin(admins, eq(adminSessions.adminId, admins.id))
        .where(
          and(
            eq(adminSessions.tokenHash, tokenHash),
            gt(adminSessions.expiresAt, new Date()),
            eq(admins.active, true),
          ),
        )
        .limit(1);
      return record;
    },

    async deleteSession(tokenHash: string) {
      await db
        .delete(adminSessions)
        .where(eq(adminSessions.tokenHash, tokenHash));
    },
  };
}

export type AuthRepository = ReturnType<typeof createAuthRepository>;
