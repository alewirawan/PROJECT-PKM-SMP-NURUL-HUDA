import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import { agenda } from "../../db/schema/agenda.js";
import type { AgendaInput } from "./agenda.schema.js";

export function createAgendaRepository(db: Database) {
  return {
    async list(publicOnly: boolean) {
      return db
        .select()
        .from(agenda)
        .where(publicOnly ? eq(agenda.visibility, "Publik") : undefined)
        .orderBy(asc(agenda.date), asc(agenda.time), asc(agenda.id));
    },
    async create(input: AgendaInput) {
      const [record] = await db
        .insert(agenda)
        .values({ id: randomUUID(), ...input })
        .returning();
      return record!;
    },
    async update(id: string, input: AgendaInput) {
      const [record] = await db
        .update(agenda)
        .set(input)
        .where(eq(agenda.id, id))
        .returning();
      return record;
    },
    async remove(id: string) {
      const [record] = await db
        .delete(agenda)
        .where(eq(agenda.id, id))
        .returning({ id: agenda.id });
      return Boolean(record);
    },
  };
}
export type AgendaRepository = ReturnType<typeof createAgendaRepository>;
