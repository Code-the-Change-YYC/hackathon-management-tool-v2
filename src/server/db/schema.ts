import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgTableCreator,
	text,
	timestamp,
	uuid
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth-schema";
import { scores } from "./scores-schema";

export const createTable = pgTableCreator((name) => `hackathon_${name}`);

// Singleton table for hackathon settings
export const hackathonSettings = createTable("hackathon_settings", {
	id: integer("id").primaryKey().default(1), // Enforce singleton by always using ID 1
	startDate: timestamp("start_date", { withTimezone: true }),
	endDate: timestamp("end_date", { withTimezone: true }),
	isActive: boolean("is_active").default(true).notNull(),
	currentRoundId: uuid("current_round_id"), // Reference to active judging round
	metadata: text("metadata") // JSON string for extra settings
});

export const judgingRounds = createTable("judging_round", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	startTime: timestamp("start_time", { withTimezone: true }).notNull(),
	endTime: timestamp("end_time", { withTimezone: true }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const judgingAssignments = createTable("judging_assignment", {
	id: uuid("id").primaryKey().defaultRandom(),
	judgeId: text("judge_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	teamId: text("team_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	roundId: uuid("round_id")
		.notNull()
		.references(() => judgingRounds.id, { onDelete: "cascade" }),
	timeSlot: timestamp("time_slot", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull()
});

export const scores = createTable("score", {
	id: uuid("id").primaryKey().defaultRandom(),
	assignmentId: uuid("assignment_id")
		.notNull()
		.references(() => judgingAssignments.id, { onDelete: "cascade" }),
	criteria: text("criteria").notNull(), // e.g., "Innovation", "Technical Difficulty"
	score: integer("score").notNull(),
	feedback: text("feedback"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull()
});

// Relations
export const judgingRoundRelations = relations(judgingRounds, ({ many }) => ({
	assignments: many(judgingAssignments)
}));

export const judgingAssignmentRelations = relations(
	judgingAssignments,
	({ one, many }) => ({
		judge: one(user, {
			fields: [judgingAssignments.judgeId],
			references: [user.id]
		}),
		team: one(organization, {
			fields: [judgingAssignments.teamId],
			references: [organization.id]
		}),
		round: one(judgingRounds, {
			fields: [judgingAssignments.roundId],
			references: [judgingRounds.id]
		}),
		scores: many(scores)
	})
);

export const scoreRelations = relations(scores, ({ one }) => ({
	assignment: one(judgingAssignments, {
		fields: [scores.assignmentId],
		references: [judgingAssignments.id]
	})
}));
