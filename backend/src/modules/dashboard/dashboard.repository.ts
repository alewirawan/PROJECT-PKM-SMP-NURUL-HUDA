import { count, eq } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import { agenda } from "../../db/schema/agenda.js";
import { applications } from "../../db/schema/applications.js";
import { teachers } from "../../db/schema/directory.js";
import { students } from "../../db/schema/students.js";

type DashboardMetric = {
  count: number | null;
  status: "available" | "unavailable";
};

const available = (value: number): DashboardMetric => ({
  count: value,
  status: "available",
});

export function createDashboardRepository(db: Database) {
  return {
    async summary() {
      const [studentRows, teacherRows, applicationRows, agendaRows] =
        await Promise.all([
          db
            .select({ count: count() })
            .from(students)
            .where(eq(students.status, "active")),
          db.select({ count: count() }).from(teachers),
          db.select({ count: count() }).from(applications),
          db.select({ count: count() }).from(agenda),
        ]);

      return {
        students: available(studentRows[0]!.count),
        teachers: available(teacherRows[0]!.count),
        ppdbApplicants: available(applicationRows[0]!.count),
        agenda: available(agendaRows[0]!.count),
      };
    },
  };
}

export type DashboardRepository = ReturnType<typeof createDashboardRepository>;
