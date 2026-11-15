import type {
  ApplicationReceipt,
  PublicApplicationData,
  PublicApplicationFile,
} from "./public-application.schema.js";
import type { ApplicationSubmissionRepository } from "./application-submission.repository.js";

export function createApplicationSubmissionService(
  repository: ApplicationSubmissionRepository,
) {
  return {
    submit(
      key: string,
      data: PublicApplicationData,
      files: PublicApplicationFile[],
    ): Promise<ApplicationReceipt> {
      return repository.submit(key, data, files);
    },
  };
}

export type ApplicationSubmissionService = ReturnType<
  typeof createApplicationSubmissionService
>;
