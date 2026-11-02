import { boolean, integer, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { JUDGING_PHASES } from "@/lib/judging";
import { judgingRounds } from "./judging-schema";
import { createTable } from "./table";

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
