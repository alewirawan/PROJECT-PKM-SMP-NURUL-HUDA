CREATE FUNCTION nh_valid_document_requirements(value jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN coalesce(jsonb_typeof(value) = 'object'
    AND jsonb_typeof(value->'requiredKinds') = 'array'
    AND jsonb_typeof(value->'requireOneGraduationDocument') = 'boolean', false)
  THEN (value - 'requiredKinds' - 'requireOneGraduationDocument') = '{}'::jsonb
    AND (value->'requiredKinds') <@ '["skl","ijazah","kk","ktp","akta"]'::jsonb
    AND jsonb_array_length(value->'requiredKinds') = (SELECT count(DISTINCT item) FROM jsonb_array_elements(value->'requiredKinds') item)
  ELSE false END;
$$;
--> statement-breakpoint
CREATE FUNCTION nh_valid_paragraphs(value jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN coalesce(jsonb_typeof(value) = 'array', false)
  THEN jsonb_array_length(value) > 0 AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(value) item
    WHERE jsonb_typeof(item) <> 'string' OR length(item #>> '{}') NOT BETWEEN 1 AND 5000
  ) ELSE false END;
$$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM application_documents WHERE document_type NOT IN ('skl','ijazah','kk','ktp','kip','akta','photo')) THEN
    RAISE EXCEPTION 'Jenis berkas lama belum dikenali. Petakan document_type sebelum migration; tidak ada data yang dihapus.';
  END IF;
END $$;
--> statement-breakpoint
CREATE TYPE "public"."document_kind" AS ENUM('skl', 'ijazah', 'kk', 'ktp', 'kip', 'akta', 'photo');--> statement-breakpoint
CREATE TYPE "public"."document_review_status" AS ENUM('missing', 'pending', 'verified', 'needs_correction');--> statement-breakpoint
CREATE TYPE "public"."leader_level" AS ENUM('principal', 'leadership', 'support');--> statement-breakpoint
CREATE TYPE "public"."teacher_cluster" AS ENUM('Sains', 'Bahasa', 'Sosial', 'Kreatif & Karakter');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('Terbit', 'Draft');--> statement-breakpoint
CREATE TYPE "public"."achievement_category" AS ENUM('Akademik', 'Olahraga', 'Seni', 'Literasi', 'Keagamaan');--> statement-breakpoint
CREATE TYPE "public"."achievement_level" AS ENUM('Sekolah', 'Kecamatan', 'Kabupaten', 'Kota', 'Provinsi', 'Nasional');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('Baru', 'Dibaca', 'Selesai');--> statement-breakpoint
CREATE TYPE "public"."applicant_token_purpose" AS ENUM('activation', 'recovery');--> statement-breakpoint
CREATE TABLE "application_choices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"club_id" varchar(120),
	"name_snapshot" varchar(80) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"selected_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "application_choices_name_ck" CHECK (length(btrim("application_choices"."name_snapshot")) > 0 AND lower(btrim("application_choices"."name_snapshot")) <> 'belum menentukan' AND "application_choices"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "application_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" "application_status",
	"to_status" "application_status" NOT NULL,
	"changed_by" uuid,
	"reason" varchar(1000),
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_requests" (
	"key" uuid PRIMARY KEY NOT NULL,
	"payload_hash" varchar(64) NOT NULL,
	"application_id" uuid,
	"state" varchar(16) DEFAULT 'processing' NOT NULL,
	"receipt" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "submission_requests_hash_ck" CHECK ("submission_requests"."payload_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "submission_requests_state_ck" CHECK (("submission_requests"."state" = 'processing' AND "submission_requests"."application_id" IS NULL AND "submission_requests"."receipt" IS NULL) OR ("submission_requests"."state" = 'completed' AND "submission_requests"."application_id" IS NOT NULL AND "submission_requests"."receipt" IS NOT NULL AND jsonb_typeof("submission_requests"."receipt") = 'object')),
	CONSTRAINT "submission_requests_expiry_ck" CHECK ("submission_requests"."expires_at" > "submission_requests"."created_at")
);
--> statement-breakpoint
CREATE TABLE "application_document_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"kind" "document_kind" NOT NULL,
	"current_version_id" uuid,
	"status" "document_review_status" DEFAULT 'missing' NOT NULL,
	"received_physically" boolean DEFAULT false NOT NULL,
	"review_note" varchar(400),
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_slots_application_kind_uq" UNIQUE("application_id","kind"),
	CONSTRAINT "document_slots_id_application_uq" UNIQUE("id","application_id"),
	CONSTRAINT "document_slots_presence_ck" CHECK (("application_document_slots"."status" = 'missing' AND "application_document_slots"."current_version_id" IS NULL AND NOT "application_document_slots"."received_physically") OR ("application_document_slots"."status" <> 'missing' AND ("application_document_slots"."current_version_id" IS NOT NULL OR "application_document_slots"."received_physically"))),
	CONSTRAINT "document_slots_review_note_ck" CHECK ("application_document_slots"."status" <> 'needs_correction' OR ("application_document_slots"."review_note" IS NOT NULL AND length(btrim("application_document_slots"."review_note")) > 0))
);
--> statement-breakpoint
CREATE TABLE "document_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"version_id" uuid,
	"status" "document_review_status" NOT NULL,
	"received_physically" boolean NOT NULL,
	"note" varchar(400) DEFAULT '' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_reviews_status_ck" CHECK ("document_reviews"."status" <> 'missing' AND ("document_reviews"."version_id" IS NOT NULL OR "document_reviews"."received_physically") AND ("document_reviews"."status" <> 'needs_correction' OR length(btrim("document_reviews"."note")) > 0))
);
--> statement-breakpoint
CREATE TABLE "admission_periods" (
	"academic_year" varchar(9) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admission_periods_year_ck" CHECK ("admission_periods"."academic_year" ~ '^[0-9]{4}/[0-9]{4}$' AND substring("admission_periods"."academic_year", 6, 4)::int = substring("admission_periods"."academic_year", 1, 4)::int + 1)
);
--> statement-breakpoint
CREATE TABLE "school_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"school_name" varchar(120) NOT NULL,
	"tagline" varchar(160) NOT NULL,
	"email" varchar(254) NOT NULL,
	"ppdb_email" varchar(254) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"whatsapp" varchar(30) NOT NULL,
	"address" varchar(500) NOT NULL,
	"academic_year" varchar(9) NOT NULL,
	"registration_open" boolean DEFAULT false NOT NULL,
	"registration_opens_at" timestamp with time zone,
	"registration_closes_at" timestamp with time zone,
	"document_requirements" jsonb NOT NULL,
	"data_retention" varchar(16) DEFAULT 'indefinite' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_settings_singleton_ck" CHECK ("school_settings"."id" = 1),
	CONSTRAINT "school_settings_requirements_ck" CHECK (nh_valid_document_requirements("school_settings"."document_requirements")),
	CONSTRAINT "school_settings_retention_ck" CHECK ("school_settings"."data_retention" = 'indefinite'),
	CONSTRAINT "school_settings_dates_ck" CHECK ("school_settings"."registration_opens_at" IS NULL OR "school_settings"."registration_closes_at" IS NULL OR "school_settings"."registration_closes_at" > "school_settings"."registration_opens_at"),
	CONSTRAINT "school_settings_text_ck" CHECK (length(btrim("school_settings"."school_name")) >= 2 AND length(btrim("school_settings"."tagline")) >= 2 AND length(btrim("school_settings"."address")) >= 10 AND length("school_settings"."phone") >= 8 AND length("school_settings"."whatsapp") >= 8)
);
--> statement-breakpoint
CREATE TABLE "school_leaders" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"teacher_id" varchar(120),
	"name" varchar(120) NOT NULL,
	"role" varchar(120) NOT NULL,
	"initials" varchar(3) NOT NULL,
	"focus" varchar(240) NOT NULL,
	"tone" varchar(30) NOT NULL,
	"level" "leader_level" NOT NULL,
	"portrait_index" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_leaders_values_ck" CHECK ("school_leaders"."portrait_index" BETWEEN 0 AND 7 AND "school_leaders"."sort_order" >= 0),
	CONSTRAINT "school_leaders_text_ck" CHECK (length(btrim("school_leaders"."name")) >= 2 AND length(btrim("school_leaders"."role")) >= 2 AND length(btrim("school_leaders"."initials")) >= 1 AND length(btrim("school_leaders"."focus")) >= 2)
);
--> statement-breakpoint
CREATE TABLE "teachers" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"initials" varchar(3) NOT NULL,
	"subject" varchar(120) NOT NULL,
	"cluster" "teacher_cluster" NOT NULL,
	"years" integer NOT NULL,
	"note" varchar(300) NOT NULL,
	"tone" varchar(30) NOT NULL,
	"portrait_index" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teachers_values_ck" CHECK ("teachers"."years" BETWEEN 0 AND 60 AND "teachers"."portrait_index" BETWEEN 0 AND 7 AND "teachers"."sort_order" >= 0),
	CONSTRAINT "teachers_text_ck" CHECK (length(btrim("teachers"."name")) >= 2 AND length(btrim("teachers"."initials")) >= 1 AND length(btrim("teachers"."subject")) >= 2 AND length(btrim("teachers"."note")) >= 2)
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(180) NOT NULL,
	"slug" text NOT NULL,
	"category" varchar(60) NOT NULL,
	"image" varchar(500) NOT NULL,
	"excerpt" varchar(220) NOT NULL,
	"content" jsonb NOT NULL,
	"author" varchar(120) NOT NULL,
	"created_by" uuid,
	"status" "post_status" DEFAULT 'Draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug"),
	CONSTRAINT "posts_slug_ck" CHECK ("posts"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "posts_content_ck" CHECK (nh_valid_paragraphs("posts"."content")),
	CONSTRAINT "posts_text_ck" CHECK (length(btrim("posts"."title")) >= 3 AND length(btrim("posts"."excerpt")) >= 10 AND length(btrim("posts"."author")) >= 2)
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(120) NOT NULL,
	"award" varchar(120) NOT NULL,
	"level" "achievement_level" NOT NULL,
	"year" varchar(4) NOT NULL,
	"category" "achievement_category" NOT NULL,
	"description" varchar(600) NOT NULL,
	"image" varchar(500) NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "achievements_year_ck" CHECK ("achievements"."year" ~ '^[0-9]{4}$'),
	CONSTRAINT "achievements_text_ck" CHECK (length(btrim("achievements"."title")) > 0 AND length(btrim("achievements"."award")) > 0 AND length(btrim("achievements"."description")) > 0)
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(254) NOT NULL,
	"topic" varchar(120) NOT NULL,
	"message" varchar(3000) NOT NULL,
	"status" "message_status" DEFAULT 'Baru' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_messages_text_ck" CHECK (length(btrim("contact_messages"."name")) >= 2 AND length(btrim("contact_messages"."topic")) >= 2 AND length(btrim("contact_messages"."message")) >= 10)
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(254) NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applicant_access_tokens" (
	"token_hash" varchar(64) PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"purpose" "applicant_token_purpose" NOT NULL,
	"issued_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	CONSTRAINT "applicant_tokens_hash_ck" CHECK ("applicant_access_tokens"."token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "applicant_tokens_expiry_ck" CHECK ("applicant_access_tokens"."expires_at" > "applicant_access_tokens"."created_at" AND ("applicant_access_tokens"."consumed_at" IS NULL OR "applicant_access_tokens"."consumed_at" >= "applicant_access_tokens"."created_at"))
);
--> statement-breakpoint
CREATE TABLE "applicant_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"password_hash" varchar(255),
	"activated_at" timestamp with time zone,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applicant_accounts_application_id_unique" UNIQUE("application_id"),
	CONSTRAINT "applicant_accounts_activation_ck" CHECK ("applicant_accounts"."activated_at" IS NULL OR "applicant_accounts"."password_hash" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "applicant_sessions" (
	"token_hash" varchar(64) PRIMARY KEY NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "applicant_sessions_hash_ck" CHECK ("applicant_sessions"."token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "applicant_sessions_expiry_ck" CHECK ("applicant_sessions"."expires_at" > "applicant_sessions"."created_at")
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid,
	"applicant_account_id" uuid,
	"action" varchar(80) NOT NULL,
	"resource_type" varchar(80) NOT NULL,
	"resource_id" varchar(120),
	"request_id" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_events_actor_ck" CHECK ("audit_events"."admin_id" IS NULL OR "audit_events"."applicant_account_id" IS NULL),
	CONSTRAINT "audit_events_action_ck" CHECK (length(btrim("audit_events"."action")) > 0 AND length(btrim("audit_events"."resource_type")) > 0)
);
--> statement-breakpoint
ALTER TABLE "application_documents" DROP CONSTRAINT "application_documents_application_id_applications_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "registration_number" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "registration_number" SET DEFAULT 'NH-' || upper(replace(gen_random_uuid()::text, '-', ''));--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "program" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "application_documents" ADD COLUMN "slot_id" uuid;--> statement-breakpoint
ALTER TABLE "application_documents" ADD COLUMN "schema_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "application_documents" ALTER COLUMN "schema_version" SET DEFAULT 2;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "academic_year" varchar(9);--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "document_requirements" jsonb;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "schema_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "schema_version" SET DEFAULT 2;--> statement-breakpoint
INSERT INTO application_document_slots (application_id, kind)
SELECT DISTINCT application_id, document_type::document_kind FROM application_documents;
--> statement-breakpoint
UPDATE application_documents d SET slot_id = s.id
FROM application_document_slots s WHERE s.application_id = d.application_id AND s.kind::text = d.document_type;
--> statement-breakpoint
ALTER TABLE application_documents ALTER COLUMN slot_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_id_slot_uq" UNIQUE("id","slot_id");
--> statement-breakpoint
UPDATE application_document_slots s SET
  current_version_id = d.id,
  status = (CASE d.status WHEN 'verified' THEN 'verified' WHEN 'rejected' THEN 'needs_correction' ELSE 'pending' END)::document_review_status,
  review_note = CASE WHEN d.status = 'rejected' THEN 'Dokumen lama ditandai perlu perbaikan; catatan rinci belum tersedia.' ELSE NULL END,
  reviewed_at = d.verified_at, reviewed_by = d.verified_by
FROM (SELECT DISTINCT ON (slot_id) * FROM application_documents ORDER BY slot_id, uploaded_at DESC, id DESC) d
WHERE s.id = d.slot_id;
--> statement-breakpoint
ALTER TABLE "application_choices" ADD CONSTRAINT "application_choices_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_choices" ADD CONSTRAINT "application_choices_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_changed_by_admins_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_requests" ADD CONSTRAINT "submission_requests_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_document_slots" ADD CONSTRAINT "application_document_slots_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_document_slots" ADD CONSTRAINT "application_document_slots_reviewed_by_admins_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_document_slots" ADD CONSTRAINT "document_slots_current_version_fk" FOREIGN KEY ("current_version_id","id") REFERENCES "public"."application_documents"("id","slot_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_reviews" ADD CONSTRAINT "document_reviews_slot_id_application_document_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."application_document_slots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_reviews" ADD CONSTRAINT "document_reviews_reviewed_by_admins_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_reviews" ADD CONSTRAINT "document_reviews_version_owner_fk" FOREIGN KEY ("version_id","slot_id") REFERENCES "public"."application_documents"("id","slot_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_settings" ADD CONSTRAINT "school_settings_period_fk" FOREIGN KEY ("academic_year") REFERENCES "public"."admission_periods"("academic_year") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_leaders" ADD CONSTRAINT "school_leaders_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicant_access_tokens" ADD CONSTRAINT "applicant_access_tokens_account_id_applicant_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."applicant_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicant_access_tokens" ADD CONSTRAINT "applicant_access_tokens_issued_by_admins_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicant_accounts" ADD CONSTRAINT "applicant_accounts_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicant_sessions" ADD CONSTRAINT "applicant_sessions_account_id_applicant_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."applicant_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_applicant_account_id_applicant_accounts_id_fk" FOREIGN KEY ("applicant_account_id") REFERENCES "public"."applicant_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "application_choices_name_uq" ON "application_choices" USING btree ("application_id",lower(btrim("name_snapshot")));--> statement-breakpoint
CREATE INDEX "application_choices_club_idx" ON "application_choices" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "application_status_history_app_idx" ON "application_status_history" USING btree ("application_id","changed_at");--> statement-breakpoint
CREATE INDEX "submission_requests_expiry_idx" ON "submission_requests" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "document_slots_status_idx" ON "application_document_slots" USING btree ("status","application_id");--> statement-breakpoint
CREATE INDEX "document_reviews_slot_date_idx" ON "document_reviews" USING btree ("slot_id","reviewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "school_leaders_one_principal_uq" ON "school_leaders" USING btree ("level") WHERE "school_leaders"."level" = 'principal';--> statement-breakpoint
CREATE INDEX "school_leaders_order_idx" ON "school_leaders" USING btree ("level","sort_order","id");--> statement-breakpoint
CREATE INDEX "teachers_order_idx" ON "teachers" USING btree ("sort_order","id");--> statement-breakpoint
CREATE INDEX "posts_status_updated_idx" ON "posts" USING btree ("status","updated_at","id");--> statement-breakpoint
CREATE INDEX "achievements_public_filter_idx" ON "achievements" USING btree ("published","year","category");--> statement-breakpoint
CREATE INDEX "contact_messages_status_date_idx" ON "contact_messages" USING btree ("status","submitted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_email_uq" ON "newsletter_subscriptions" USING btree (lower(btrim("email")));--> statement-breakpoint
CREATE INDEX "applicant_tokens_account_idx" ON "applicant_access_tokens" USING btree ("account_id","purpose");--> statement-breakpoint
CREATE INDEX "applicant_tokens_expiry_idx" ON "applicant_access_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "applicant_sessions_account_idx" ON "applicant_sessions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "applicant_sessions_expiry_idx" ON "applicant_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "audit_events_resource_idx" ON "audit_events" USING btree ("resource_type","resource_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_events_admin_idx" ON "audit_events" USING btree ("admin_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_events_applicant_idx" ON "audit_events" USING btree ("applicant_account_id","created_at");--> statement-breakpoint
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_slot_owner_fk" FOREIGN KEY ("slot_id","application_id") REFERENCES "public"."application_document_slots"("id","application_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_academic_year_admission_periods_academic_year_fk" FOREIGN KEY ("academic_year") REFERENCES "public"."admission_periods"("academic_year") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_documents_slot_date_idx" ON "application_documents" USING btree ("slot_id","uploaded_at");--> statement-breakpoint
CREATE INDEX "applications_period_status_cursor_idx" ON "applications" USING btree ("academic_year","status","submitted_at","id");--> statement-breakpoint
CREATE INDEX "applications_source_cursor_idx" ON "applications" USING btree ("source","submitted_at","id");--> statement-breakpoint
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_schema_version_ck" CHECK ("application_documents"."schema_version" IN (1, 2));--> statement-breakpoint
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_v2_file_ck" CHECK ("application_documents"."schema_version" = 1 OR ("application_documents"."file_size" BETWEEN 1 AND 5242880 AND "application_documents"."mime_type" IN ('application/pdf', 'image/jpeg', 'image/png') AND length(btrim("application_documents"."original_name")) > 0 AND length(btrim("application_documents"."storage_key")) > 0));--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_schema_version_ck" CHECK ("applications"."schema_version" IN (1, 2));--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_v2_required_ck" CHECK ("applications"."schema_version" = 1 OR (
    "applications"."nisn" IS NOT NULL AND "applications"."birth_place" IS NOT NULL AND "applications"."birth_date" IS NOT NULL
    AND "applications"."gender" IS NOT NULL AND "applications"."address" IS NOT NULL AND "applications"."parent_name" IS NOT NULL
    AND "applications"."phone" IS NOT NULL AND "applications"."email" IS NOT NULL AND "applications"."academic_year" IS NOT NULL
    AND "applications"."document_requirements" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_v2_values_ck" CHECK ("applications"."schema_version" = 1 OR (
    "applications"."registration_number" ~ '^NH-[A-Z0-9-]+$' AND "applications"."nisn" ~ '^[0-9]{10}$'
    AND length(btrim("applications"."student_name")) BETWEEN 2 AND 120 AND length(btrim("applications"."origin_school")) BETWEEN 2 AND 160
    AND length(btrim("applications"."birth_place")) BETWEEN 2 AND 100 AND "applications"."gender" IN ('Laki-laki', 'Perempuan')
    AND length(btrim("applications"."address")) BETWEEN 1 AND 600 AND length(btrim("applications"."parent_name")) BETWEEN 2 AND 120
    AND "applications"."phone" ~ '^[+]?[0-9 ]{8,20}$' AND position('@' in "applications"."email") > 1
    AND ("applications"."notes" IS NULL OR length("applications"."notes") <= 1000)
    AND nh_valid_document_requirements("applications"."document_requirements")));
--> statement-breakpoint
CREATE FUNCTION nh_guard_application() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Arsip pendaftaran tidak boleh dihapus.'; END IF;
  IF TG_OP = 'INSERT' AND NEW.schema_version <> 2 THEN
    RAISE EXCEPTION 'Pendaftaran baru wajib memakai schema_version 2.';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF ROW(NEW.id, NEW.registration_number, NEW.source, NEW.submitted_at)
      IS DISTINCT FROM ROW(OLD.id, OLD.registration_number, OLD.source, OLD.submitted_at) THEN
      RAISE EXCEPTION 'Identitas pencatatan pendaftaran tidak dapat diubah.';
    END IF;
    IF OLD.schema_version = 2 AND ROW(NEW.schema_version, NEW.document_requirements, NEW.academic_year)
      IS DISTINCT FROM ROW(OLD.schema_version, OLD.document_requirements, OLD.academic_year) THEN
      RAISE EXCEPTION 'Snapshot kebijakan dan periode pendaftaran tidak dapat diubah.';
    END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER applications_guard BEFORE INSERT OR UPDATE OR DELETE ON applications
FOR EACH ROW EXECUTE FUNCTION nh_guard_application();
--> statement-breakpoint
CREATE FUNCTION nh_guard_document_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Versi berkas merupakan arsip dan tidak boleh dihapus.'; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.schema_version <> 2 OR NEW.document_type = 'photo' THEN
      RAISE EXCEPTION 'Upload baru wajib versi 2 dan memakai enam jenis berkas PPDB.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM application_document_slots s WHERE s.id = NEW.slot_id
      AND s.application_id = NEW.application_id AND s.kind::text = NEW.document_type) THEN
      RAISE EXCEPTION 'Slot, jenis, dan pemilik berkas tidak cocok.';
    END IF;
  END IF;
  IF TG_OP = 'UPDATE' AND ROW(NEW.id, NEW.application_id, NEW.slot_id, NEW.document_type,
    NEW.original_name, NEW.storage_key, NEW.mime_type, NEW.file_size, NEW.uploaded_at, NEW.schema_version)
    IS DISTINCT FROM ROW(OLD.id, OLD.application_id, OLD.slot_id, OLD.document_type,
    OLD.original_name, OLD.storage_key, OLD.mime_type, OLD.file_size, OLD.uploaded_at, OLD.schema_version) THEN
    RAISE EXCEPTION 'Metadata file tidak boleh ditimpa; buat versi baru.';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER document_versions_guard BEFORE INSERT OR UPDATE OR DELETE ON application_documents
FOR EACH ROW EXECUTE FUNCTION nh_guard_document_version();
--> statement-breakpoint
CREATE FUNCTION nh_guard_document_slot() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF ROW(NEW.id, NEW.application_id, NEW.kind) IS DISTINCT FROM ROW(OLD.id, OLD.application_id, OLD.kind) THEN
    RAISE EXCEPTION 'Identitas slot dokumen tidak dapat dipindahkan.';
  END IF;
  IF NEW.current_version_id IS DISTINCT FROM OLD.current_version_id THEN
    IF NEW.current_version_id IS NULL OR NEW.status <> 'pending'
      OR NEW.reviewed_at IS NOT NULL OR NEW.reviewed_by IS NOT NULL
      OR coalesce(NEW.review_note, '') <> '' THEN
      RAISE EXCEPTION 'File pengganti wajib menunggu pemeriksaan dengan hasil review dikosongkan.';
    END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER document_slots_guard BEFORE UPDATE ON application_document_slots
FOR EACH ROW EXECUTE FUNCTION nh_guard_document_slot();
--> statement-breakpoint
CREATE FUNCTION nh_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Riwayat bersifat append-only; perubahan atau penghapusan ditolak.'; END $$;
--> statement-breakpoint
CREATE TRIGGER document_reviews_append_only BEFORE UPDATE OR DELETE ON document_reviews FOR EACH ROW EXECUTE FUNCTION nh_append_only();
--> statement-breakpoint
CREATE TRIGGER application_status_append_only BEFORE UPDATE OR DELETE ON application_status_history FOR EACH ROW EXECUTE FUNCTION nh_append_only();
--> statement-breakpoint
CREATE TRIGGER audit_events_append_only BEFORE UPDATE OR DELETE ON audit_events FOR EACH ROW EXECUTE FUNCTION nh_append_only();
