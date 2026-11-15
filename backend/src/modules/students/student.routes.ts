import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  onRequestHookHandler,
} from "fastify";
import type { StudentsRepository } from "./student.repository.js";
import { createStudentsService } from "./student.service.js";

export async function registerStudentsRoutes(
  app: FastifyInstance,
  repository: StudentsRepository,
  guard: onRequestHookHandler,
) {
  const service = createStudentsService(repository);

  const listStudents = async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header("Cache-Control", "no-store");
    return service.list(request.query);
  };
  app.get("/students", { onRequest: guard }, listStudents);
  app.get("/students/", { onRequest: guard }, listStudents);

  app.get(
    "/students/:studentId",
    { onRequest: guard },
    async (request, reply) => {
      reply.header("Cache-Control", "no-store");
      return service.getById(request.params);
    },
  );
}
