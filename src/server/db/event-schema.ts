import { relations } from "drizzle-orm";
import {
	index,
	pgEnum,
	pgTableCreator,
	text,
	timestamp,
	unique,
	uuid
} from "drizzle-orm/pg-core";
import { EVENT_STATUSES, EVENT_TYPES, EventStatus } from "@/types/types";
import { user } from "./auth-schema";

export const createTable = pgTableCreator((name) => `hackathon_${name}`);

export const eventTypeEnum = pgEnum("hackathon_event_type", EVENT_TYPES);
export const eventStatusEnum = pgEnum("hackathon_event_status", EVENT_STATUSES);

export const event = createTable(
	"event",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		title: text("title").notNull(),
		description: text("description").default("").notNull(),
		type: eventTypeEnum("type").notNull(),
		status: eventStatusEnum("status").default(EventStatus.DRAFT).notNull(),
		startTime: timestamp("start_time", { withTimezone: true }).notNull(),
		endTime: timestamp("end_time", { withTimezone: true }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		index("event_type_status_start_time_idx").on(
			table.type,
			table.status,
			table.startTime
		)
	]
);

export const eventAttendance = createTable(
	"event_attendance",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		eventId: uuid("event_id")
			.notNull()
			.references(() => event.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		unique("event_attendance_user_event_unique").on(table.userId, table.eventId)
	]
);

export const eventTicket = createTable(
	"event_ticket",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		eventId: uuid("event_id")
			.notNull()
			.references(() => event.id, { onDelete: "cascade" }),
		tokenHash: text("token_hash").notNull().unique(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		unique("event_ticket_user_event_unique").on(table.userId, table.eventId),
		index("event_ticket_event_id_idx").on(table.eventId)
	]
);

export const eventRelations = relations(event, ({ many }) => ({
	attendance: many(eventAttendance),
	tickets: many(eventTicket)
}));

export const eventAttendanceRelations = relations(
	eventAttendance,
	({ one }) => ({
		user: one(user, {
			fields: [eventAttendance.userId],
			references: [user.id]
		}),
		event: one(event, {
			fields: [eventAttendance.eventId],
			references: [event.id]
		})
	})
);

export const eventTicketRelations = relations(eventTicket, ({ one }) => ({
	user: one(user, {
		fields: [eventTicket.userId],
		references: [user.id]
	}),
	event: one(event, {
		fields: [eventTicket.eventId],
		references: [event.id]
	})
}));
