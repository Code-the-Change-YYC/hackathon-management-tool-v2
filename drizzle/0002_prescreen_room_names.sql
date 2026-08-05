ALTER TABLE "hackathon_organization" ADD COLUMN IF NOT EXISTS "team_code" text;
ALTER TABLE "hackathon_organization" ADD COLUMN IF NOT EXISTS "prescreen_status" text DEFAULT 'pending';
ALTER TABLE "hackathon_organization" ADD COLUMN IF NOT EXISTS "prescreen_comments" text;
ALTER TABLE "hackathon_organization" ADD COLUMN IF NOT EXISTS "prescreened_by" text;
ALTER TABLE "hackathon_organization" ADD COLUMN IF NOT EXISTS "prescreened_at" timestamp;

UPDATE "hackathon_organization"
SET "prescreen_status" = 'pending'
WHERE "prescreen_status" IS NULL;

ALTER TABLE "hackathon_organization" ALTER COLUMN "prescreen_status" SET DEFAULT 'pending';
ALTER TABLE "hackathon_organization" ALTER COLUMN "prescreen_status" SET NOT NULL;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'hackathon_organization_team_code_unique'
	) THEN
		ALTER TABLE "hackathon_organization"
		ADD CONSTRAINT "hackathon_organization_team_code_unique"
		UNIQUE ("team_code");
	END IF;
END $$;

ALTER TABLE "hackathon_organization"
DROP CONSTRAINT IF EXISTS "hackathon_organization_prescreened_by_hackathon_user_id_fk";

ALTER TABLE "hackathon_organization"
ADD CONSTRAINT "hackathon_organization_prescreened_by_hackathon_user_id_fk"
FOREIGN KEY ("prescreened_by") REFERENCES "hackathon_user" ("id")
ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "hackathon_judging_room" ADD COLUMN IF NOT EXISTS "name" text;

UPDATE "hackathon_judging_room"
SET "name" = 'Room ' || substring("id"::text from 1 for 8)
WHERE "name" IS NULL;

ALTER TABLE "hackathon_judging_room" ALTER COLUMN "name" SET NOT NULL;
