import { eq } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import {
  applicationStatusHistory,
  applications,
} from "../../db/schema/applications.js";
import {
  applicationReEnrollments,
  students,
} from "../../db/schema/students.js";
import {
  ConflictError,
  NotFoundError,
} from "../../shared/errors/app-error.js";

type StudentIdentity = {
  studentName: string;
  nisn: string | null;
  birthPlace: string | null;
  birthDate: Date | null;
  gender: string | null;
  address: string | null;
};

function assertStudentIdentity(
  application: StudentIdentity,
): void {
  if (
    application.studentName.trim().length < 2 ||
    application.studentName.trim().length > 120 ||
    (application.nisn !== null && !/^\d{10}$/.test(application.nisn)) ||
    (application.gender !== null &&
      application.gender !== "Laki-laki" &&
      application.gender !== "Perempuan")
  ) {
    throw new ConflictError(
      "Identitas pendaftar perlu diverifikasi sebelum dicatat sebagai siswa.",
    );
  }
}

function isUniqueViolation(
  error: unknown,
  visited = new Set<object>(),
): boolean {
  if (typeof error !== "object" || error === null || visited.has(error))
    return false;
  visited.add(error);
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && isUniqueViolation(error.cause, visited);
}

export function createApplicationWorkflowRepository(db: Database) {
  return {
    async accept(registrationNumber: string, adminId: string) {
      return db.transaction(async (tx) => {
        const [application] = await tx
          .select({
            id: applications.id,
            registrationNumber: applications.registrationNumber,
            status: applications.status,
          })
          .from(applications)
          .where(eq(applications.registrationNumber, registrationNumber))
          .limit(1)
          .for("update");

        if (!application)
          throw new NotFoundError("Pendaftar PPDB tidak ditemukan.");
        if (application.status === "accepted")
          return {
            applicationId: application.registrationNumber,
            status: "accepted" as const,
            changed: false,
          };

        const [existingStudent] = await tx
          .select({ id: students.id })
          .from(students)
          .where(eq(students.applicationId, application.id))
          .limit(1);
        if (existingStudent)
          throw new ConflictError(
            "Status PPDB tidak dapat diubah setelah siswa tercatat.",
          );
        if (
          application.status !== "verified" &&
          application.status !== "interview"
        ) {
          throw new ConflictError(
            "Pendaftar harus terverifikasi sebelum dapat diterima.",
          );
        }

        await tx
          .update(applications)
          .set({ status: "accepted" })
          .where(eq(applications.id, application.id));
        await tx.insert(applicationStatusHistory).values({
          applicationId: application.id,
          fromStatus: application.status,
          toStatus: "accepted",
          changedBy: adminId,
          reason: "Ditetapkan diterima oleh admin.",
        });

        return {
          applicationId: application.registrationNumber,
          status: "accepted" as const,
          changed: true,
        };
      });
    },

    async completeReEnrollment(
      registrationNumber: string,
      adminId: string,
    ) {
      try {
        return await db.transaction(async (tx) => {
          const [application] = await tx
            .select({
              id: applications.id,
              status: applications.status,
              studentName: applications.studentName,
              nisn: applications.nisn,
              birthPlace: applications.birthPlace,
              birthDate: applications.birthDate,
              gender: applications.gender,
              address: applications.address,
            })
            .from(applications)
            .where(eq(applications.registrationNumber, registrationNumber))
            .limit(1)
            .for("update");

          if (!application)
            throw new NotFoundError("Pendaftar PPDB tidak ditemukan.");
          if (application.status !== "accepted")
            throw new ConflictError(
              "Daftar ulang hanya dapat diselesaikan oleh pendaftar yang diterima.",
            );

          let [reEnrollment] = await tx
            .select()
            .from(applicationReEnrollments)
            .where(
              eq(applicationReEnrollments.applicationId, application.id),
            )
            .limit(1)
            .for("update");

          const [existingStudent] = await tx
            .select({
              id: students.id,
              studentName: students.studentName,
              status: students.status,
              officiallyRegisteredAt: students.officiallyRegisteredAt,
            })
            .from(students)
            .where(eq(students.applicationId, application.id))
            .limit(1)
            .for("update");

          if (existingStudent) {
            if (
              reEnrollment?.status === "completed" &&
              reEnrollment.confirmedAt
            ) {
              return {
                student: existingStudent,
                reEnrollment,
                created: false,
              };
            }
            throw new ConflictError(
              "Status daftar ulang tidak dapat diubah setelah siswa tercatat.",
            );
          }

          assertStudentIdentity(application);

          if (!reEnrollment) {
            [reEnrollment] = await tx
              .insert(applicationReEnrollments)
              .values({ applicationId: application.id })
              .returning();
          }
          if (!reEnrollment)
            throw new ConflictError(
              "Status daftar ulang pendaftar tidak dapat dipastikan.",
            );

          if (reEnrollment.status === "pending") {
            const [completed] = await tx
              .update(applicationReEnrollments)
              .set({
                status: "completed",
                confirmedAt: new Date(),
                confirmedBy: adminId,
              })
              .where(eq(applicationReEnrollments.id, reEnrollment.id))
              .returning();
            reEnrollment = completed!;
          }

          if (
            reEnrollment.status !== "completed" ||
            !reEnrollment.confirmedAt
          )
            throw new ConflictError(
              "Daftar ulang belum dapat dikonfirmasi.",
            );

          const [student] = await tx
            .insert(students)
            .values({
              applicationId: application.id,
              studentName: application.studentName,
              nisn: application.nisn,
              birthPlace: application.birthPlace,
              birthDate: application.birthDate,
              gender: application.gender,
              address: application.address,
              status: "active",
            })
            .returning({
              id: students.id,
              studentName: students.studentName,
              status: students.status,
              officiallyRegisteredAt: students.officiallyRegisteredAt,
            });

          return { student: student!, reEnrollment, created: true };
        });
      } catch (error) {
        if (isUniqueViolation(error))
          throw new ConflictError(
            "NISN atau pendaftar sudah tercatat sebagai siswa.",
          );
        throw error;
      }
    },
  };
}

export type ApplicationWorkflowRepository = ReturnType<
  typeof createApplicationWorkflowRepository
>;
