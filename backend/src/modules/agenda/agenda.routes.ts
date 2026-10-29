import type { FastifyInstance, onRequestHookHandler } from "fastify";
import type { AgendaRepository } from "./agenda.repository.js";
import { createAgendaService } from "./agenda.service.js";

export async function registerAgendaRoutes(
  app: FastifyInstance,
  repository: AgendaRepository,
  guard: onRequestHookHandler,
) {
  const service = createAgendaService(repository);
  app.get("/agenda", () => service.list(true));
  app.get("/admin/agenda", { onRequest: guard }, (_, reply) => {
    reply.header("Cache-Control", "no-store");
    return service.list(false);
  });
  app.post("/agenda", { onRequest: guard }, async (request, reply) =>
    reply.code(201).send(await service.create(request.body)),
  );
  app.patch<{ Params: { agendaId: string } }>(
    "/agenda/:agendaId",
    { onRequest: guard },
    (request) => service.update(request.params.agendaId, request.body),
  );
  app.delete<{ Params: { agendaId: string } }>(
    "/agenda/:agendaId",
    { onRequest: guard },
    async (request, reply) => {
      await service.remove(request.params.agendaId);
      return reply.code(204).send();
    },
  );
}
