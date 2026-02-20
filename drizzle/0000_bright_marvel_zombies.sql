CREATE TABLE "hackathon_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hackathon_invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hackathon_member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hackathon_organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	CONSTRAINT "hackathon_organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "hackathon_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	"impersonated_by" text,
	CONSTRAINT "hackathon_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "hackathon_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"allergies" text,
	"school" text,
	"program" text,
	"completed_registration" boolean DEFAULT false NOT NULL,
	CONSTRAINT "hackathon_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "hackathon_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"criteria_id" uuid NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hackathon_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"max_score" integer NOT NULL,
	"is_sidepot" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hackathon_account" ADD CONSTRAINT "hackathon_account_user_id_hackathon_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hackathon_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_invitation" ADD CONSTRAINT "hackathon_invitation_organization_id_hackathon_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."hackathon_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_invitation" ADD CONSTRAINT "hackathon_invitation_inviter_id_hackathon_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."hackathon_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_member" ADD CONSTRAINT "hackathon_member_organization_id_hackathon_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."hackathon_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_member" ADD CONSTRAINT "hackathon_member_user_id_hackathon_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hackathon_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_session" ADD CONSTRAINT "hackathon_session_user_id_hackathon_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."hackathon_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_hackathon_settings" ADD CONSTRAINT "hackathon_hackathon_settings_current_round_id_hackathon_judging_round_id_fk" FOREIGN KEY ("current_round_id") REFERENCES "public"."hackathon_judging_round"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_judging_assignment" ADD CONSTRAINT "hackathon_judging_assignment_judge_id_hackathon_user_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."hackathon_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_judging_assignment" ADD CONSTRAINT "hackathon_judging_assignment_team_id_hackathon_organization_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."hackathon_organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_judging_assignment" ADD CONSTRAINT "hackathon_judging_assignment_round_id_hackathon_judging_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."hackathon_judging_round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_score" ADD CONSTRAINT "hackathon_score_assignment_id_hackathon_judging_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."hackathon_judging_assignment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_score" ADD CONSTRAINT "hackathon_score_criteria_id_hackathon_criteria_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "public"."hackathon_criteria"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "hackathon_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "hackathon_invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "hackathon_invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "hackathon_member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "hackathon_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "hackathon_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "hackathon_verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "one_score_per_criteria_per_assignment" ON "hackathon_score" USING btree ("assignment_id","criteria_id");