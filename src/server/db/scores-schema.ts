import { relations, sql } from "drizzle-orm";
import {
	boolean,
	integer,
	pgTableCreator,
	text,
	timestamp,
	uniqueIndex,
	uuid
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { judgingAssignments } from "./schema";

export const createTable = pgTableCreator((name) => `hackathon_${name}`);

export const criteria = createTable("criteria", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	description: text("description").notNull().default(""),
	displayOrder: integer("display_order").notNull().default(0),
	// Historical round scoping is retained for compatibility; scoring uses a shared rubric.
	roundIds: uuid("round_ids").array().notNull().default(sql`'{}'::uuid[]`),
	maxScore: integer("max_score").notNull(),
	isSidepot: boolean("is_sidepot").default(false).notNull()
});

export const scores = createTable(
	"score",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		// Null is reserved for historical panel scores with no recorded author.
		judgeId: text("judge_id").references(() => user.id, {
			onDelete: "cascade"
		}),
		assignmentId: uuid("assignment_id")
			.notNull()
			.references(() => judgingAssignments.id, { onDelete: "cascade" }),
		criteriaId: uuid("criteria_id")
			.notNull()
			.references(() => criteria.id, { onDelete: "cascade" }),
		value: integer("value").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull()
	},
	(t) => [
		uniqueIndex("one_score_per_criteria_per_judge_assignment").on(
			t.assignmentId,
			t.criteriaId,
			t.judgeId
		),
		uniqueIndex("one_legacy_score_per_criteria_assignment")
			.on(t.assignmentId, t.criteriaId)
			.where(sql`${t.judgeId} is null`)
	]
);

export const scoreRelations = relations(scores, ({ one }) => ({
	judge: one(user, { fields: [scores.judgeId], references: [user.id] }),
	assignment: one(judgingAssignments, {
		fields: [scores.assignmentId],
		references: [judgingAssignments.id]
	}),
	criteria: one(criteria, {
		fields: [scores.criteriaId],
		references: [criteria.id]
	})
}));
