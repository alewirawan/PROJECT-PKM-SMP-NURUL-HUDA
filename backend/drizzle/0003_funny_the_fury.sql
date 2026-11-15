CREATE TYPE "public"."re_enrollment_status" AS ENUM('pending', 'completed');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "application_re_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"status" "re_enrollment_status" DEFAULT 'pending' NOT NULL,
	"confirmed_at" timestamp with time zone,
	"confirmed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "application_re_enrollments_confirmation_ck" CHECK (("application_re_enrollments"."status" = 'completed' AND "application_re_enrollments"."confirmed_at" IS NOT NULL) OR ("application_re_enrollments"."status" = 'pending' AND "application_re_enrollments"."confirmed_at" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid,
	"student_name" varchar(160) NOT NULL,
	"nisn" varchar(10),
	"birth_place" varchar(100),
	"birth_date" date,
	"gender" varchar(20),
	"address" text,
	"officially_registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "student_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_name_ck" CHECK (length(btrim("students"."student_name")) BETWEEN 2 AND 120),
	CONSTRAINT "students_nisn_ck" CHECK ("students"."nisn" IS NULL OR "students"."nisn" ~ '^[0-9]{10}$'),
	CONSTRAINT "students_gender_ck" CHECK ("students"."gender" IS NULL OR "students"."gender" IN ('Laki-laki', 'Perempuan'))
);
--> statement-breakpoint
ALTER TABLE "application_re_enrollments" ADD CONSTRAINT "application_re_enrollments_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_re_enrollments" ADD CONSTRAINT "application_re_enrollments_confirmed_by_admins_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "application_re_enrollments_application_id_uq" ON "application_re_enrollments" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_re_enrollments_status_idx" ON "application_re_enrollments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "students_application_id_uq" ON "students" USING btree ("application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "students_nisn_uq" ON "students" USING btree ("nisn") WHERE "students"."nisn" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "students_student_name_idx" ON "students" USING btree ("student_name");--> statement-breakpoint
CREATE FUNCTION nh_guard_application_re_enrollment() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
	IF NEW.status = 'completed' AND NOT EXISTS (
		SELECT 1
		FROM applications a
		WHERE a.id = NEW.application_id
			AND a.status = 'accepted'
	) THEN
		RAISE EXCEPTION 'Daftar ulang hanya dapat dikonfirmasi untuk pendaftar berstatus diterima.'
			USING ERRCODE = '23514';
	END IF;
	RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER application_re_enrollments_acceptance_guard
BEFORE INSERT OR UPDATE OF status, application_id ON application_re_enrollments
FOR EACH ROW EXECUTE FUNCTION nh_guard_application_re_enrollment();--> statement-breakpoint
CREATE FUNCTION nh_guard_student_enrollment() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
	IF NEW.application_id IS NOT NULL AND NOT EXISTS (
		SELECT 1
		FROM applications a
		JOIN application_re_enrollments r ON r.application_id = a.id
		WHERE a.id = NEW.application_id
			AND a.status = 'accepted'
			AND r.status = 'completed'
			AND r.confirmed_at IS NOT NULL
	) THEN
		RAISE EXCEPTION 'Siswa terkait PPDB hanya dapat dicatat setelah diterima dan daftar ulang dikonfirmasi.'
			USING ERRCODE = '23514';
	END IF;
	RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER students_enrollment_guard
BEFORE INSERT OR UPDATE OF application_id ON students
FOR EACH ROW EXECUTE FUNCTION nh_guard_student_enrollment();--> statement-breakpoint