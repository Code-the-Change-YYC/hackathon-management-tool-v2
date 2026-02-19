import { relations } from "drizzle-orm";
import {
	pgTableCreator,
	text,
	timestamp,
	unique,
	uuid
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const createTable = pgTableCreator((name) => `hackathon_${name}`);

export const meal = createTable("meal", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: text("title").notNull().unique(), // can be breakfast, lunch, dinner, breakfast leftovers...
	startTime: timestamp("start_time", { withTimezone: true }).notNull().unique(),
	endTime: timestamp("end_time", { withTimezone: true }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const mealAttendance = createTable(
	"meal_attendance",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		// checkedInBy is the admin that scanned the user in for the meal
		checkedInBy: text("checked_in_by")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		mealId: uuid("meal_id")
			.notNull()
			.references(() => meal.id, { onDelete: "cascade" }),
		// createdAt is used to check when the user checked in for the meal
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(t) => [
		unique().on(t.userId, t.mealId) // each user can only attend a meal once
	]
);

export const mealRelations = relations(meal, ({ many }) => ({
	attendance: many(mealAttendance)
}));

export const mealAttendanceRelations = relations(mealAttendance, ({ one }) => ({
	user: one(user, {
		fields: [mealAttendance.userId],
		references: [user.id]
	}),
	meal: one(meal, {
		fields: [mealAttendance.mealId],
		references: [meal.id]
	}),
	admin: one(user, {
		fields: [mealAttendance.checkedInBy],
		references: [user.id]
	})
}));
