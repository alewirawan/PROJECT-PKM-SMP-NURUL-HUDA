import type { FastifyInstance, onRequestHookHandler } from "fastify";
import { UnauthorizedError } from "../../shared/errors/app-error.js";
import { parseInput } from "../../shared/http/parse-input.js";
import type { ApplicationWorkflowRepository } from "./application-workflow.repository.js";
import { createApplicationWorkflowService } from "./application-workflow.service.js";
import { applicationIdParams } from "./application-workflow.schema.js";

export async function registerApplicationWorkflowRoutes(
  app: FastifyInstance,
  repository: ApplicationWorkflowRepository,
  guard: onRequestHookHandler,
) {
  const service = createApplicationWorkflowService(repository);

  app.post(
    "/applications/:applicationId/accept",
    { onRequest: guard },
    async (request, reply) => {
      const { applicationId } = parseInput(
        applicationIdParams,
        request.params,
      );
      if (!request.adminId) throw new UnauthorizedError();
      reply.header("Cache-Control", "no-store");
      return service.accept(applicationId, request.adminId);
    },
  );

  app.post(
    "/applications/:applicationId/complete-re-enrollment",
    { onRequest: guard },
    async (request, reply) => {
      const { applicationId } = parseInput(
        applicationIdParams,
        request.params,
      );
      if (!request.adminId) throw new UnauthorizedError();
      const result = await service.completeReEnrollment(
        applicationId,
        request.adminId,
      );
      reply.code(result.created ? 201 : 200);
      reply.header("Cache-Control", "no-store");
      return {
        student: result.student,
        reEnrollment: {
          status: result.reEnrollment.status,
          confirmedAt: result.reEnrollment.confirmedAt,
        },
      };
    },
  );
}
