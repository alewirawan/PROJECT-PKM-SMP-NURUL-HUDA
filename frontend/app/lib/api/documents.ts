import { requestApi } from "../api-client";
import type { ApplicantDocument, UploadDocumentKind } from "./applications/types";

// Client pengganti pribadi mengikuti kontrak endpoint milik Anggota 07.
export function replaceMyDocument(kind: UploadDocumentKind, file: File) {
  const body = new FormData();
  body.append("file", file, file.name);
  return requestApi<ApplicantDocument>(
    `/applicant/documents/${encodeURIComponent(kind)}`,
    { method: "PUT", body, timeoutMs: 60_000 },
  );
}
