import { desc, eq } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import { contactMessages } from "../../db/schema/messages.js";
import type { ContactMessageInput, MessageStatus } from "./message.schema.js";

export function createMessageRepository(db: Database) {
  return {
    async list() {
      return db
        .select()
        .from(contactMessages)
        .orderBy(desc(contactMessages.submittedAt), desc(contactMessages.id));
    },
    async create(input: ContactMessageInput) {
      await db.insert(contactMessages).values(input);
    },
    async updateStatus(id: string, status: MessageStatus) {
      const [record] = await db
        .update(contactMessages)
        .set({ status })
        .where(eq(contactMessages.id, id))
        .returning();
      return record;
    },
    async remove(id: string) {
      const [record] = await db
        .delete(contactMessages)
        .where(eq(contactMessages.id, id))
        .returning({ id: contactMessages.id });
      return record !== undefined;
    },
  };
}
export type MessageRepository = ReturnType<typeof createMessageRepository>;