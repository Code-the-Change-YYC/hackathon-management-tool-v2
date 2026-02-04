import { relations } from "drizzle-orm";
import {
	integer,
	pgTableCreator,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth-schema";
import { judgingAssignments } from "./schema";

export const createTable = pgTableCreator((name) => `hackathon_${name}`);

export const criteria = createTable("criteria", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	maxScore: integer("max_score").notNull(),
	description: text("description"),
});

export const scores = createTable(
	"score",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		assignmentId: uuid("assignment_id")
			.notNull()
			.references(() => judgingAssignments.id, { onDelete: "cascade" }),
		criteriaId: uuid("criteria_id")
			.notNull()
			.references(() => criteria.id, { onDelete: "cascade" }),
		value: integer("value").notNull(),
		feedback: text("feedback"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("one_score_per_criteria_per_assignment").on(
			t.assignmentId,
			t.criteriaId,
		),
	],
);

export const sidepots = createTable("sidepot", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	description: text("description"),
});

export const sidepotVotes = createTable(
	"sidepot_vote",
	{
		sidepotId: uuid("sidepot_id")
			.notNull()
			.references(() => sidepots.id, { onDelete: "cascade" }),
		teamId: text("team_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		judgeId: text("judge_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(t) => [
		uniqueIndex("one_vote_per_judge_per_sidepot").on(t.sidepotId, t.judgeId),
	],
);

export const scoreRelations = relations(scores, ({ one }) => ({
	assignment: one(judgingAssignments, {
		fields: [scores.assignmentId],
		references: [judgingAssignments.id],
	}),
	criteria: one(criteria, {
		fields: [scores.criteriaId],
		references: [criteria.id],
	}),
}));
