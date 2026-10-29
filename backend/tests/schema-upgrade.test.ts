import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  copyFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { describe, it, expect } from "vitest";
import { createDatabase } from "../src/db/client.js";

const url = process.env.SCHEMA_UPGRADE_DATABASE_URL;
describe.skipIf(!url)("legacy schema upgrade", () => {
  it("rolls back unknown document kinds, then upgrades without losing legacy data or versions", async () => {
    const target = new URL(url!);
    if (
      target.hostname !== "127.0.0.1" ||
      !/^\/nh_schema_upgrade_test(?:_[a-z0-9]+)?$/.test(target.pathname)
    )
      throw new Error(
        "Gunakan database nh_schema_upgrade_test lokal yang kosong.",
      );
    const { client, db } = createDatabase(url!);
    try {
      const existing =
        await client`SELECT 1 FROM pg_tables WHERE schemaname='public'`;
      if (existing.length)
        throw new Error(
          "Tes upgrade memerlukan database kosong; tidak ada tabel yang dihapus otomatis.",
        );
      const folder = fileURLToPath(new URL("../drizzle", import.meta.url));
      const partial = await mkdtemp(
        join(tmpdir(), "nurul-huda-legacy-migrations-"),
      );
      await mkdir(join(partial, "meta"));
      const journal = JSON.parse(
        await readFile(join(folder, "meta/_journal.json"), "utf8"),
      );
      journal.entries = journal.entries.slice(0, 2);
      await writeFile(
        join(partial, "meta/_journal.json"),
        JSON.stringify(journal),
      );
      for (const entry of journal.entries)
        await copyFile(
          join(folder, `${entry.tag}.sql`),
          join(partial, `${entry.tag}.sql`),
        );
      await migrate(db, { migrationsFolder: partial });
      const [app] =
        await client`INSERT INTO applications (registration_number,student_name,origin_school,program) VALUES ('NH-LEGACY-001','Siswa Lama Contoh','SD Contoh','STEM') RETURNING id`;
      const files =
        await client`INSERT INTO application_documents (application_id,document_type,original_name,storage_key,mime_type,file_size,status,uploaded_at)
        VALUES (${app!.id},'kk','lama.pdf','legacy-1','application/pdf',100,'uploaded','2025-01-01'),
        (${app!.id},'kk','baru.pdf','legacy-2','application/pdf',200,'rejected','2025-02-01'),
        (${app!.id},'unknown','foto.jpg','legacy-3','image/jpeg',6000000,'verified','2025-03-01') RETURNING id,storage_key`;
      await expect(migrate(db, { migrationsFolder: folder })).rejects.toThrow();
      expect(
        await client`SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='school_settings'`,
      ).toHaveLength(0);
      expect(await client`SELECT id FROM application_documents`).toHaveLength(
        3,
      );
      await client`UPDATE application_documents SET document_type='photo' WHERE storage_key='legacy-3'`;
      await migrate(db, { migrationsFolder: folder });
      const [upgraded] =
        await client`SELECT id,program,schema_version,academic_year,document_requirements FROM applications WHERE id=${app!.id}`;
      expect(upgraded).toMatchObject({
        id: app!.id,
        program: "STEM",
        schema_version: 1,
        academic_year: null,
        document_requirements: null,
      });
      const retained =
        await client`SELECT id,storage_key,schema_version,slot_id FROM application_documents ORDER BY storage_key`;
      expect(retained.map((row) => row.id).sort()).toEqual(
        files.map((row) => row.id).sort(),
      );
      expect(
        retained.every((row) => row.schema_version === 1 && row.slot_id),
      ).toBe(true);
      const slots =
        await client`SELECT kind,status,current_version_id,review_note FROM application_document_slots ORDER BY kind`;
      expect(slots).toHaveLength(2);
      expect(slots.find((row) => row.kind === "kk")).toMatchObject({
        status: "needs_correction",
        current_version_id: files.find((row) => row.storage_key === "legacy-2")!
          .id,
      });
      expect(slots.find((row) => row.kind === "photo")).toMatchObject({
        status: "verified",
      });
      expect(await client`SELECT id FROM application_choices`).toHaveLength(0);
      await migrate(db, { migrationsFolder: folder });
      expect(await client`SELECT id FROM application_documents`).toHaveLength(
        3,
      );
    } finally {
      await client.end();
    }
  });
});
