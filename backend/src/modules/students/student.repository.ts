import { and, asc, eq, ilike, sql, type SQL } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import { students } from "../../db/schema/students.js";
import type { StudentListQuery } from "./student.schema.js";

export function createStudentsRepository(db: Database) {
  return {
    async list(query: StudentListQuery) {
      const conditions: SQL[] = [eq(students.status, query.status)];
      if (query.q) conditions.push(ilike(students.studentName, `%${query.q}%`));
      const where = and(...conditions);
      const [count] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(students)
        .where(where);
      const items = await db
        .select({
          id: students.id,
          studentName: students.studentName,
          status: students.status,
          officiallyRegisteredAt: students.officiallyRegisteredAt,
        })
        .from(students)
        .where(where)
        .orderBy(asc(students.studentName), asc(students.id))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit);

      return {
        items,
        page: query.page,
        limit: query.limit,
        total: count?.total ?? 0,
      };
    },

    async getById(studentId: string) {
      const [student] = await db
        .select({
          id: students.id,
          studentName: students.studentName,
          nisn: students.nisn,
          birthPlace: students.birthPlace,
          birthDate: students.birthDate,
          gender: students.gender,
          address: students.address,
          officiallyRegisteredAt: students.officiallyRegisteredAt,
          status: students.status,
          createdAt: students.createdAt,
          updatedAt: students.updatedAt,
        })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1);

      return student;
    },
  };
}

export type StudentsRepository = ReturnType<typeof createStudentsRepository>;
