import { requestApi } from "../../api-client";
import type {
  ApplicationCreate,
  ApplicationReceipt,
  UploadDocumentKind,
} from "./types";

export type ApplicationFiles = Partial<Record<UploadDocumentKind, File>>;

export async function submitApplication(
  data: ApplicationCreate,
  files: ApplicationFiles,
  idempotencyKey: string,
): Promise<ApplicationReceipt> {
  const body = new FormData();
  body.append("data", JSON.stringify(data));
  for (const [kind, file] of Object.entries(files)) {
    if (file) body.append(kind, file, file.name);
  }

  return requestApi<ApplicationReceipt>("/applications", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body,
    timeoutMs: 60_000,
  });
}
