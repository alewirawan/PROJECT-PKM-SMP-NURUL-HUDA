import { NotFoundError } from "../../shared/errors/app-error.js";
import { parseInput } from "../../shared/http/parse-input.js";
import {
  studentIdParams,
  studentListQuery,
} from "./student.schema.js";
import type { StudentsRepository } from "./student.repository.js";

export function createStudentsService(repository: StudentsRepository) {
  return {
    async list(input: unknown) {
      const query = parseInput(studentListQuery, input);
      const page = await repository.list(query);
      return {
        items: page.items.map((student) => ({
          id: student.id,
          studentName: student.studentName,
          status: student.status,
          officiallyRegisteredAt:
            student.officiallyRegisteredAt.toISOString(),
        })),
        pagination: {
          page: page.page,
          limit: page.limit,
          total: page.total,
          totalPages: Math.ceil(page.total / page.limit),
        },
      };
    },

    async getById(input: unknown) {
      const { studentId } = parseInput(studentIdParams, input);
      const student = await repository.getById(studentId);
      if (!student) throw new NotFoundError("Data siswa tidak ditemukan.");
      return {
        ...student,
        birthDate: student.birthDate?.toISOString().slice(0, 10) ?? null,
        officiallyRegisteredAt:
          student.officiallyRegisteredAt.toISOString(),
        createdAt: student.createdAt.toISOString(),
        updatedAt: student.updatedAt.toISOString(),
      };
    },
  };
}
