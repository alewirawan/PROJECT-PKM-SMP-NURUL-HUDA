import type { ApplicationWorkflowRepository } from "./application-workflow.repository.js";

export function createApplicationWorkflowService(
  repository: ApplicationWorkflowRepository,
) {
  return {
    accept(applicationId: string, adminId: string) {
      return repository.accept(applicationId, adminId);
    },

    completeReEnrollment(applicationId: string, adminId: string) {
      return repository.completeReEnrollment(applicationId, adminId);
    },
  };
}
