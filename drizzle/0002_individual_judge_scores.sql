-- Compatibility upgrade for databases older than main's individual-score schema.
-- Existing attributed scores and historical unattributed panel scores are preserved.
ALTER TABLE "hackathon_score" ADD COLUMN IF NOT EXISTS "judge_id" text;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'hackathon_score'::regclass
      AND conname = 'hackathon_score_judge_id_hackathon_user_id_fk'
  ) THEN
    ALTER TABLE "hackathon_score"
      ADD CONSTRAINT "hackathon_score_judge_id_hackathon_user_id_fk"
      FOREIGN KEY ("judge_id") REFERENCES "public"."hackathon_user"("id") ON DELETE restrict;
  END IF;
END $$;
--> statement-breakpoint
DROP INDEX IF EXISTS "one_score_per_criteria_per_assignment";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "one_score_per_judge_per_criteria_per_assignment"
  ON "hackathon_score" ("assignment_id", "criteria_id", "judge_id");
