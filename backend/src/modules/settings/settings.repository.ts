import { eq } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import { admissionPeriods, schoolSettings } from "../../db/schema/settings.js";
import type { SchoolSettingsInput } from "./settings.schema.js";

function mapSettings(row: typeof schoolSettings.$inferSelect) {
  return {
    schoolName: row.schoolName,
    tagline: row.tagline,
    email: row.email,
    ppdbEmail: row.ppdbEmail,
    phone: row.phone,
    whatsapp: row.whatsapp,
    address: row.address,
    academicYear: row.academicYear,
    registrationOpen: row.registrationOpen,
    documentRequirements: row.documentRequirements,
    registrationOpensAt: row.registrationOpensAt?.toISOString() ?? null,
    registrationClosesAt: row.registrationClosesAt?.toISOString() ?? null,
    dataRetention: "indefinite" as const,
  };
}

export function createSettingsRepository(db: Database) {
  return {
    async get() {
      const [row] = await db
        .select()
        .from(schoolSettings)
        .where(eq(schoolSettings.id, 1))
        .limit(1);
      return row ? mapSettings(row) : null;
    },
    async save(input: SchoolSettingsInput) {
      return db.transaction(async (tx) => {
        await tx
          .insert(admissionPeriods)
          .values({ academicYear: input.academicYear })
          .onConflictDoNothing();
        const [row] = await tx
          .insert(schoolSettings)
          .values({
            id: 1,
            schoolName: input.schoolName,
            tagline: input.tagline,
            email: input.email,
            ppdbEmail: input.ppdbEmail,
            phone: input.phone,
            whatsapp: input.whatsapp,
            address: input.address,
            academicYear: input.academicYear,
            registrationOpen: input.registrationOpen,
            documentRequirements: input.documentRequirements,
            registrationOpensAt: input.registrationOpensAt
              ? new Date(input.registrationOpensAt)
              : null,
            registrationClosesAt: input.registrationClosesAt
              ? new Date(input.registrationClosesAt)
              : null,
            dataRetention: "indefinite",
          })
          .onConflictDoUpdate({
            target: schoolSettings.id,
            set: {
              schoolName: input.schoolName,
              tagline: input.tagline,
              email: input.email,
              ppdbEmail: input.ppdbEmail,
              phone: input.phone,
              whatsapp: input.whatsapp,
              address: input.address,
              academicYear: input.academicYear,
              registrationOpen: input.registrationOpen,
              documentRequirements: input.documentRequirements,
              registrationOpensAt: input.registrationOpensAt
                ? new Date(input.registrationOpensAt)
                : null,
              registrationClosesAt: input.registrationClosesAt
                ? new Date(input.registrationClosesAt)
                : null,
              dataRetention: "indefinite",
              updatedAt: new Date(),
            },
          })
          .returning();
        if (!row) throw new Error("Pengaturan sekolah gagal disimpan.");
        return mapSettings(row);
      });
    },
  };
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>;
