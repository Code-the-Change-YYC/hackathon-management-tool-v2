import { relations, sql } from "drizzle-orm";
import {
	boolean,
	integer,
	text,
	timestamp,
	uniqueIndex,
	uuid
} from "drizzle-orm/pg-core";
import { JUDGING_ROUND_KINDS } from "@/lib/judging";
import { organization, user } from "./auth-schema";
import { createTable } from "./table";

// startTime and endTime bound the window the schedule generator must fit in.
export const judgingRounds = createTable("judging_round", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	kind: text("kind", { enum: JUDGING_ROUND_KINDS }).notNull(),
	startTime: timestamp("start_time", { withTimezone: true }).notNull(),
	endTime: timestamp("end_time", { withTimezone: true }).notNull(),
	// Participants only see their schedule once the round is published.
	publishedAt: timestamp("published_at", { withTimezone: true }),
	// Minimum judges per table. null for final round.
	panelSize: integer("panel_size"),
	// Computed by the generator for panel rounds and set by an admin for finals.
	presentationMinutes: integer("presentation_minutes"),
	changeoverMinutes: integer("changeover_minutes").notNull().default(2),
	breakMinutes: integer("break_minutes").notNull().default(10),
	maxBlockMinutes: integer("max_block_minutes").notNull().default(50),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const judgingTables = createTable(
	"judging_table",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		roundId: uuid("round_id")
			.references(() => judgingRounds.id, { onDelete: "cascade" })
			.notNull(),
		tableNumber: integer("table_number").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		uniqueIndex("judging_table_round_number_uniq").on(
			table.roundId,
			table.tableNumber
		)
	]
);

export const judgingTableJudges = createTable(
	"judging_table_judge",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		tableId: uuid("table_id")
			.notNull()
			.references(() => judgingTables.id, { onDelete: "cascade" }),
		judgeId: text("judge_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull()
	},
	(table) => [
		uniqueIndex("judging_table_judge_table_judge_uniq").on(
			table.tableId,
			table.judgeId
		)
	]
);

// A presentation ends at startsAt plus the round's presentationMinutes.
export const judgingAssignments = createTable(
	"judging_assignment",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		teamId: text("team_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		tableId: uuid("table_id")
			.notNull()
			.references(() => judgingTables.id, { onDelete: "cascade" }),
		startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull()
	},
	(table) => [
		uniqueIndex("judging_assignment_table_starts_at_uniq").on(
			table.tableId,
			table.startsAt
		),
		uniqueIndex("judging_assignment_team_table_uniq").on(
			table.teamId,
			table.tableId
		)
	]
);

export const judgingCriteria = createTable("judging_criterion", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	description: text("description").notNull().default(""),
	displayOrder: integer("display_order").notNull().default(0),
	// Empty means the criterion applies to every round (including existing criteria).
	roundIds: uuid("round_ids").array().notNull().default(sql`'{}'::uuid[]`),
	maxScore: integer("max_score").notNull(),
	isSidepot: boolean("is_sidepot").default(false).notNull()
});

export const judgingScores = createTable(
	"judging_score",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		assignmentId: uuid("assignment_id")
			.notNull()
			.references(() => judgingAssignments.id, { onDelete: "cascade" }),
		criteriaId: uuid("criteria_id")
			.notNull()
			.references(() => judgingCriteria.id, { onDelete: "cascade" }),
		judgeId: text("judge_id")
			.notNull()
			.references(() => user.id, { onDelete: "restrict" }),
		value: integer("value").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull()
	},
	(t) => [
		uniqueIndex("one_score_per_judge_per_criteria_per_assignment").on(
			t.assignmentId,
			t.criteriaId,
			t.judgeId
		)
	]
);

export const judgingRoundRelations = relations(judgingRounds, ({ many }) => ({
	tables: many(judgingTables)
}));

export const judgingTableRelations = relations(
	judgingTables,
	({ one, many }) => ({
		round: one(judgingRounds, {
			fields: [judgingTables.roundId],
			references: [judgingRounds.id]
		}),
		judges: many(judgingTableJudges),
		assignments: many(judgingAssignments)
	})
);

export const judgingTableJudgeRelations = relations(
	judgingTableJudges,
	({ one }) => ({
		table: one(judgingTables, {
			fields: [judgingTableJudges.tableId],
			references: [judgingTables.id]
		}),
		judge: one(user, {
			fields: [judgingTableJudges.judgeId],
			references: [user.id]
		})
	})
);

export const judgingAssignmentRelations = relations(
	judgingAssignments,
	({ one, many }) => ({
		team: one(organization, {
			fields: [judgingAssignments.teamId],
			references: [organization.id]
		}),
		table: one(judgingTables, {
			fields: [judgingAssignments.tableId],
			references: [judgingTables.id]
		}),
		scores: many(judgingScores)
	})
);

export const judgingScoreRelations = relations(judgingScores, ({ one }) => ({
	assignment: one(judgingAssignments, {
		fields: [judgingScores.assignmentId],
		references: [judgingAssignments.id]
	}),
	criteria: one(judgingCriteria, {
		fields: [judgingScores.criteriaId],
		references: [judgingCriteria.id]
	})
}));
