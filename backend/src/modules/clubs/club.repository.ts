import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import { clubs } from "../../db/schema/clubs.js";
import type { ClubInput, ClubUpdate } from "./club.schema.js";

export function createClubRepository(db: Database) {
  return {
    async list(publicOnly: boolean) {
      return db
        .select()
        .from(clubs)
        .where(publicOnly ? eq(clubs.active, true) : undefined)
        .orderBy(asc(clubs.name), asc(clubs.id));
    },
    async create(input: ClubInput) {
      const [record] = await db
        .insert(clubs)
        .values({ id: randomUUID(), ...input })
        .returning();
      return record!;
    },
    async update(id: string, input: ClubUpdate) {
      const [record] = await db
        .update(clubs)
        .set(input)
        .where(eq(clubs.id, id))
        .returning();
      return record;
    },
  };
}
export type ClubRepository = ReturnType<typeof createClubRepository>;
