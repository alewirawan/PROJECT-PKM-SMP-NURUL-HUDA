import { AppError } from "../../shared/errors/app-error.js";
import { parseInput } from "../../shared/http/parse-input.js";
import type { AgendaRepository } from "./agenda.repository.js";
import { agendaInput } from "./agenda.schema.js";

export function createAgendaService(repository: AgendaRepository) {
  const missing = () =>
    new AppError("Agenda tidak ditemukan.", 404, "NOT_FOUND");
  return {
    list: (publicOnly: boolean) => repository.list(publicOnly),
    create: (input: unknown) =>
      repository.create(parseInput(agendaInput, input)),
    async update(id: string, input: unknown) {
      const record = await repository.update(
        id,
        parseInput(agendaInput, input),
      );
      if (!record) throw missing();
      return record;
    },
    async remove(id: string) {
      if (!(await repository.remove(id))) throw missing();
    },
  };
}
