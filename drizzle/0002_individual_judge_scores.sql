-- Keep historical panel scores unattributed. They cannot safely be assigned
-- to individual judges and are excluded from individual-score averages.
ALTER TABLE "hackathon_score" ADD COLUMN "judge_id" text;
--> statement-breakpoint
ALTER TABLE "hackathon_score" ADD CONSTRAINT "hackathon_score_judge_id_hackathon_user_id_fk"
  FOREIGN KEY ("judge_id") REFERENCES "public"."hackathon_user"("id") ON DELETE cascade;
--> statement-breakpoint
DROP INDEX "one_score_per_criteria_per_assignment";
--> statement-breakpoint
CREATE UNIQUE INDEX "one_score_per_criteria_per_judge_assignment"
  ON "hackathon_score" ("assignment_id", "criteria_id", "judge_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "one_legacy_score_per_criteria_assignment"
  ON "hackathon_score" ("assignment_id", "criteria_id") WHERE "judge_id" IS NULL;
