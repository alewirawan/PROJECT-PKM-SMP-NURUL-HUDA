CREATE TYPE "public"."agenda_type" AS ENUM('Akademik', 'PPDB', 'Kegiatan', 'Rapat');--> statement-breakpoint
CREATE TYPE "public"."agenda_visibility" AS ENUM('Publik', 'Internal');--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"description" varchar(300) NOT NULL,
	"active" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agenda" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"title" varchar(160) NOT NULL,
	"date" date NOT NULL,
	"time" varchar(5) NOT NULL,
	"location" varchar(160) NOT NULL,
	"type" "agenda_type" NOT NULL,
	"completed" boolean NOT NULL,
	"visibility" "agenda_visibility" DEFAULT 'Internal' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "clubs_name_unique" ON "clubs" USING btree (lower(btrim("name")));--> statement-breakpoint
CREATE INDEX "agenda_visibility_date_idx" ON "agenda" USING btree ("visibility","date");