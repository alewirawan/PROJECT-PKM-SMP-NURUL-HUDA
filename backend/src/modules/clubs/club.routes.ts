import type { FastifyInstance, onRequestHookHandler } from "fastify";
import type { ClubRepository } from "./club.repository.js";
import { createClubService } from "./club.service.js";

export async function registerClubRoutes(
  app: FastifyInstance,
  repository: ClubRepository,
  guard: onRequestHookHandler,
) {
  const service = createClubService(repository);
  app.get("/clubs", () => service.list(true));
  app.get("/admin/clubs", { onRequest: guard }, (_, reply) => {
    reply.header("Cache-Control", "no-store");
    return service.list(false);
  });
  app.post("/clubs", { onRequest: guard }, async (request, reply) =>
    reply.code(201).send(await service.create(request.body)),
  );
  app.patch<{ Params: { clubId: string } }>(
    "/clubs/:clubId",
    { onRequest: guard },
    (request) => service.update(request.params.clubId, request.body),
  );
}
