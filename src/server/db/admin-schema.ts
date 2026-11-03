import { boolean, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createTable } from "./table";

// Singleton table for hackathon settings
export const hackathonSettings = createTable("hackathon_settings", {
	id: integer("id").primaryKey().default(1), // Enforce singleton by always using ID 1
	startDate: timestamp("start_date", { withTimezone: true }),
	endDate: timestamp("end_date", { withTimezone: true }),
	submissionDeadline: timestamp("submission_deadline", { withTimezone: true }),
	scoresReleased: boolean("scores_released").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: text("metadata") // JSON string for extra settings
});
