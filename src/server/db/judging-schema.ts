import { relations, sql } from "drizzle-orm";
import {
	boolean,
	integer,
	text,
	timestamp,
	uniqueIndex,
	uuid
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth-schema";
import { createTable } from "./table";

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

export const judgingRooms = createTable("judging_room", {
	id: uuid("id").primaryKey().defaultRandom(),
	roundId: uuid("round_id")
		.references(() => judgingRounds.id, { onDelete: "cascade" })
		.notNull(),
	roomLink: text("room_link").notNull(), // link to the video meeting
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

/** Display label when the DB has no persisted room name column. */
export function judgingRoomDisplayName(index: number) {
	return `Room ${index + 1}`;
}

export const judgingRoomStaff = createTable(
	"judging_room_staff",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		roomId: uuid("room_id")
			.notNull()
			.references(() => judgingRooms.id, { onDelete: "cascade" }),
		staffId: text("staff_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull()
	},
	(table) => [
		uniqueIndex("judging_room_judge_room_judge_uniq").on(
			table.roomId,
			table.staffId
		)
	]
);

export const judgingAssignments = createTable("judging_assignment", {
	id: uuid("id").primaryKey().defaultRandom(),
	teamId: text("team_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	roomId: uuid("room_id")
		.notNull()
		.references(() => judgingRooms.id, { onDelete: "cascade" }),
	timeSlot: timestamp("time_slot", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull()
});

export const criteria = createTable("criteria", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	description: text("description").notNull().default(""),
	displayOrder: integer("display_order").notNull().default(0),
	// Empty means the criterion applies to every round (including existing criteria).
	roundIds: uuid("round_ids").array().notNull().default(sql`'{}'::uuid[]`),
	maxScore: integer("max_score").notNull(),
	isSidepot: boolean("is_sidepot").default(false).notNull()
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
		// Null preserves historical shared scores whose author is unknown.
		judgeId: text("judge_id").references(() => user.id, {
			onDelete: "restrict"
		}),
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

// Relations
export const judgingRoundRelations = relations(judgingRounds, ({ many }) => ({
	rooms: many(judgingRooms)
}));

export const judgingRoomRelations = relations(
	judgingRooms,
	({ one, many }) => ({
		round: one(judgingRounds, {
			fields: [judgingRooms.roundId],
			references: [judgingRounds.id]
		}),
		staff: many(judgingRoomStaff),
		assignments: many(judgingAssignments)
	})
);

export const judgingRoomStaffRelations = relations(
	judgingRoomStaff,
	({ one }) => ({
		room: one(judgingRooms, {
			fields: [judgingRoomStaff.roomId],
			references: [judgingRooms.id]
		}),
		staff: one(user, {
			fields: [judgingRoomStaff.staffId],
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
		room: one(judgingRooms, {
			fields: [judgingAssignments.roomId],
			references: [judgingRooms.id]
		}),
		scores: many(scores)
	})
);

export const scoreRelations = relations(scores, ({ one }) => ({
	assignment: one(judgingAssignments, {
		fields: [scores.assignmentId],
		references: [judgingAssignments.id]
	}),
	criteria: one(criteria, {
		fields: [scores.criteriaId],
		references: [criteria.id]
	})
}));
