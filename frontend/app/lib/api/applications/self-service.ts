import { requestApi } from "../../api-client";
import type { ApplicantRecord } from "./types";

export function getMyApplication() {
  return requestApi<ApplicantRecord>("/applicant/application", { cache: "no-store" });
}
