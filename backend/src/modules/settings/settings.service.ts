import { AppError } from "../../shared/errors/app-error.js";
import { parseInput } from "../../shared/http/parse-input.js";
import type { SettingsRepository } from "./settings.repository.js";
import { schoolSettingsInput } from "./settings.schema.js";

export function createSettingsService(repository: SettingsRepository) {
  return {
    async get() {
      const settings = await repository.get();
      if (!settings)
        throw new AppError(
          "Pengaturan sekolah belum dikonfigurasi.",
          503,
          "SERVICE_UNAVAILABLE",
        );
      return settings;
    },
    save(input: unknown) {
      return repository.save(parseInput(schoolSettingsInput, input));
    },
  };
}
