import { hasBackendApi, requestApi } from "../../api-client";
import { getSchoolSettings } from "../../local-cms";
import type { RegistrationSettings } from "./types";

export async function getRegistrationSettings(): Promise<{
  settings: RegistrationSettings;
  demo: boolean;
}> {
  if (hasBackendApi()) {
    const settings = await requestApi<RegistrationSettings>("/settings");
    return { settings, demo: false };
  }

  const local = getSchoolSettings();
  return {
    demo: true,
    settings: {
      academicYear: local.academicYear,
      registrationOpen: local.registrationOpen,
      registrationOpensAt: null,
      registrationClosesAt: null,
      documentRequirements: {
        requiredKinds: [],
        requireOneGraduationDocument: false,
      },
    },
  };
}
