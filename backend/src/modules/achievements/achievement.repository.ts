import { asc, desc, eq } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import { achievements } from "../../db/schema/achievements.js";
import type { AchievementInput, AchievementUpdate } from "./achievement.schema.js";

export function createAchievementRepository(db: Database) {
  return {
    async list(publicOnly: boolean) {
      return db
        .select()
        .from(achievements)
        .where(publicOnly ? eq(achievements.published, true) : undefined)
        .orderBy(
          desc(achievements.year),
          asc(achievements.title),
          asc(achievements.id),
        );
    },
    async create(input: AchievementInput) {
      const [record] = await db.insert(achievements).values(input).returning();
      return record!;
    },
    async update(id: string, input: AchievementUpdate) {
      const [record] = await db
        .update(achievements)
        .set(input)
        .where(eq(achievements.id, id))
        .returning();
      return record;
    },
    async remove(id: string) {
      const [record] = await db
        .delete(achievements)
        .where(eq(achievements.id, id))
        .returning({ id: achievements.id });
      return record !== undefined;
    },
  };
}
export type AchievementRepository = ReturnType<
  typeof createAchievementRepository
>;