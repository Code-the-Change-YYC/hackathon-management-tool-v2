import { relations, sql } from "drizzle-orm";
import {
	check,
	index,
	pgTableCreator,
	text,
	timestamp,
	unique,
	uuid
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const EVENT_TYPES = ["food", "activity", "project", "ceremony"] as const;
export const EVENT_STATUSES = ["draft", "active"] as const;
export const QR_EVENT_TYPES = ["food", "activity"] as const;

export type EventType = (typeof EVENT_TYPES)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];
export type QrEventType = (typeof QR_EVENT_TYPES)[number];

export const createTable = pgTableCreator((name) => `hackathon_${name}`);

export const event = createTable(
	"event",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		title: text("title").notNull(),
		description: text("description").default("").notNull(),
		type: text("type", { enum: EVENT_TYPES }).default("food").notNull(),
		status: text("status", { enum: EVENT_STATUSES }).default("draft").notNull(),
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
		check(
			"event_type_check",
			sql`${table.type} in ('food', 'activity', 'project', 'ceremony')`
		),
		check("event_status_check", sql`${table.status} in ('draft', 'active')`),
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
