import {
	boolean,
	integer,
	text,
	timestamp,
	uniqueIndex,
	uuid
} from "drizzle-orm/pg-core";
import { JUDGING_PHASES } from "@/lib/judging";
import { user } from "./auth-schema";
import { judgingRounds } from "./judging-schema";
import { createTable } from "./table";

export const roleInvitation = createTable(
	"role_invitation",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		email: text("email").notNull(),
		role: text("role").notNull(),
		invitedById: text("invited_by_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		acceptedAt: timestamp("accepted_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull()
	},
	(table) => [uniqueIndex("role_invitation_email_uniq").on(table.email)]
);

// Singleton table for hackathon settings
export const hackathonSettings = createTable("hackathon_settings", {
	id: integer("id").primaryKey().default(1), // Enforce singleton by always using ID 1
	startDate: timestamp("start_date", { withTimezone: true }),
	endDate: timestamp("end_date", { withTimezone: true }),
	submissionDeadline: timestamp("submission_deadline", { withTimezone: true }),
	judgingPhase: text("judging_phase", { enum: JUDGING_PHASES })
		.default("not_started")
		.notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	currentRoundId: uuid("current_round_id").references(() => judgingRounds.id, {
		onDelete: "set null"
	}), // Reference to active judging round
	metadata: text("metadata") // JSON string for extra settings
});
