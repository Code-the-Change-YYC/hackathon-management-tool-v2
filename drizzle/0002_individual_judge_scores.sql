ALTER TABLE "hackathon_score" ADD COLUMN "judge_id" text;
--> statement-breakpoint
ALTER TABLE "hackathon_score" ADD CONSTRAINT "hackathon_score_judge_id_hackathon_user_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."hackathon_user"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
DROP INDEX "one_score_per_criteria_per_assignment";
--> statement-breakpoint
CREATE UNIQUE INDEX "one_score_per_judge_per_criteria_per_assignment" ON "hackathon_score" USING btree ("assignment_id", "criteria_id", "judge_id");
