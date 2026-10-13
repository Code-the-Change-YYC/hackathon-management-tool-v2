-- Apply once to an existing database before deploying the score ownership API.
-- The repository uses db:push for schema sync; this explicit migration preserves data.
BEGIN;
ALTER TABLE "hackathon_score" ADD COLUMN "judge_id" text;
ALTER TABLE "hackathon_score" ADD CONSTRAINT "hackathon_score_judge_id_hackathon_user_id_fk"
 FOREIGN KEY ("judge_id") REFERENCES "hackathon_user"("id") ON DELETE RESTRICT;
CREATE UNIQUE INDEX "one_score_per_judge_per_criteria_per_assignment"
 ON "hackathon_score" ("assignment_id", "criteria_id", "judge_id");
DROP INDEX "one_score_per_criteria_per_assignment";
-- Preserve score values; standardize only main-criterion scale metadata.
UPDATE "hackathon_criteria" SET "max_score" = 10 WHERE "is_sidepot" = false;
COMMIT;
