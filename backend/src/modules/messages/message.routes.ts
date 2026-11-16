import type { FastifyInstance, onRequestHookHandler } from "fastify";
import type { MessageRepository } from "./message.repository.js";
import { createMessageService } from "./message.service.js";

export async function registerMessageRoutes(
  app: FastifyInstance,
  repository: MessageRepository,
  guard: onRequestHookHandler,
) {
  const service = createMessageService(repository);
  app.post("/messages", async (request, reply) => {
    await service.create(request.body);
    return reply.code(201).send();
  });
  app.get("/messages", { onRequest: guard }, (_, reply) => {
    reply.header("Cache-Control", "no-store");
    return service.list();
  });
  app.patch<{ Params: { messageId: string } }>(
    "/messages/:messageId",
    { onRequest: guard },
    (request) => service.updateStatus(request.params.messageId, request.body),
  );
  app.delete<{ Params: { messageId: string } }>(
    "/messages/:messageId",
    { onRequest: guard },
    async (request, reply) => {
      await service.remove(request.params.messageId);
      return reply.code(204).send();
    },
  );
}