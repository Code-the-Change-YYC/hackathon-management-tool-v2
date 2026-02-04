import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	pgTableCreator,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth-schema";
import { scores } from "./scores-schema";

export const createTable = pgTableCreator((name) => `hackathon_${name}`);

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
	roomLink: text("room_link").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const judgingRoomJudges = createTable(
	"judging_room_judge",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		roomId: uuid("room_id")
			.notNull()
			.references(() => judgingRooms.id, { onDelete: "cascade" }),
		judgeId: text("judge_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("judging_room_judge_room_judge_uniq").on(
			table.roomId,
			table.judgeId,
		),
	],
);

export const judgingRoomAdmins = createTable(
	"judging_room_admin",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		roomId: uuid("room_id")
			.notNull()
			.references(() => judgingRooms.id, { onDelete: "cascade" }),
		adminId: text("admin_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("judging_room_admin_room_admin_uniq").on(
			table.roomId,
			table.adminId,
		),
	],
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

// Singleton table for hackathon settings
export const hackathonSettings = createTable("hackathon_settings", {
	id: integer("id").primaryKey().default(1), // Enforce singleton by always using ID 1
	startDate: timestamp("start_date", { withTimezone: true }),
	endDate: timestamp("end_date", { withTimezone: true }),
	isActive: boolean("is_active").default(true).notNull(),
	currentRoundId: uuid("current_round_id").references(() => judgingRounds.id, {
		onDelete: "set null"
	}), // Reference to active judging round
	metadata: text("metadata") // JSON string for extra settings
});

// Relations
export const judgingRoundRelations = relations(judgingRounds, ({ many }) => ({
	assignments: many(judgingAssignments)
}));

export const judgingRoomRelations = relations(judgingRooms, ({ many }) => ({
	admins: many(judgingRoomAdmins),
	judges: many(judgingRoomJudges),
}));

export const judgingAssignmentRelations = relations(
	judgingAssignments,
	({ one, many }) => ({
		team: one(organization, {
			fields: [judgingAssignments.teamId],
			references: [organization.id]
		}),
		room: one(judgingRooms, {
			fields: [judgingAssignments.roomId],
			references: [judgingRooms.id],
		}),
		scores: many(scores)
	})
);
export { scores };
