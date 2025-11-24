CREATE TABLE "hackathon_hackathon_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"current_round_id" uuid,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "hackathon_judging_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"judge_id" text NOT NULL,
	"team_id" text NOT NULL,
	"round_id" uuid NOT NULL,
	"time_slot" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hackathon_judging_round" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hackathon_score" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"criteria" text NOT NULL,
	"score" integer NOT NULL,
	"feedback" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hackathon_judging_assignment" ADD CONSTRAINT "hackathon_judging_assignment_judge_id_user_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_judging_assignment" ADD CONSTRAINT "hackathon_judging_assignment_team_id_organization_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_judging_assignment" ADD CONSTRAINT "hackathon_judging_assignment_round_id_hackathon_judging_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."hackathon_judging_round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_score" ADD CONSTRAINT "hackathon_score_assignment_id_hackathon_judging_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."hackathon_judging_assignment"("id") ON DELETE cascade ON UPDATE no action;