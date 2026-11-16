import { AppError } from "../../shared/errors/app-error.js";
import { parseInput } from "../../shared/http/parse-input.js";
import { contactMessageInput, messageStatusUpdate } from "./message.schema.js";
import type { MessageRepository } from "./message.repository.js";

export function createMessageService(repository: MessageRepository) {
  return {
    list: () => repository.list(),
    async create(input: unknown) {
      const value = parseInput(contactMessageInput, input);
      await repository.create(value);
    },
    async updateStatus(id: string, input: unknown) {
      const value = parseInput(messageStatusUpdate, input);
      const record = await repository.updateStatus(id, value.status);
      if (!record) {
        throw new AppError("Pesan tidak ditemukan.", 404, "NOT_FOUND");
      }
      return record;
    },
    async remove(id: string) {
      const removed = await repository.remove(id);
      if (!removed) {
        throw new AppError("Pesan tidak ditemukan.", 404, "NOT_FOUND");
      }
    },
  };
}
export type MessageService = ReturnType<typeof createMessageService>;