import { getEventDate } from "drizzle/seedUtils";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { event, eventAttendance } from "@/server/db/event-schema";
import { EventStatus, EventType, type User } from "@/types/types";

const MEAL_SCHEDULE = [
	{
		title: "Day 1 Breakfast",
		description: "Start the hackathon with breakfast and coffee.",
		day: 0,
		startHour: 8,
		endHour: 10
	},
	{
		title: "Day 1 Lunch",
		description: "Take a break and join us for lunch.",
		day: 0,
		startHour: 12,
		endHour: 14
	},
	{
		title: "Day 1 Dinner",
		description: "Recharge with dinner before the evening build session.",
		day: 0,
		startHour: 18,
		endHour: 20
	},
	{
		title: "Day 2 Breakfast",
		description: "Fuel up for the final day of hacking.",
		day: 1,
		startHour: 8,
		endHour: 10
	},
	{
		title: "Day 2 Lunch",
		description: "Join us for lunch before final submissions.",
		day: 1,
		startHour: 12,
		endHour: 14
	},
	{
		title: "Day 2 Dinner",
		description: "Wrap up the weekend with dinner.",
		day: 1,
		startHour: 18,
		endHour: 20
	}
];

type SeededMeal = typeof event.$inferSelect;

export async function seedMeals(participantUser: User): Promise<SeededMeal[]> {
	console.log("\nCreating meals and sample attendance...");

	const meals: SeededMeal[] = [];

	for (const scheduledMeal of MEAL_SCHEDULE) {
		const startTime = getEventDate(scheduledMeal.day, scheduledMeal.startHour);
		const endTime = getEventDate(scheduledMeal.day, scheduledMeal.endHour);
		const existingMeal = await db.query.event.findFirst({
			where: and(
				eq(event.title, scheduledMeal.title),
				eq(event.startTime, startTime),
				eq(event.type, EventType.FOOD)
			)
		});

		const [seededMeal] = existingMeal
			? await db
					.update(event)
					.set({
						description: scheduledMeal.description,
						endTime,
						status: EventStatus.ACTIVE
					})
					.where(eq(event.id, existingMeal.id))
					.returning()
			: await db
					.insert(event)
					.values({
						title: scheduledMeal.title,
						description: scheduledMeal.description,
						type: EventType.FOOD,
						status: EventStatus.ACTIVE,
						startTime,
						endTime
					})
					.returning();

		if (seededMeal) meals.push(seededMeal);
	}

	// Give the sample participant one attendance record for ticket testing.
	const firstMeal = meals[0];
	if (firstMeal) {
		await db
			.insert(eventAttendance)
			.values({ eventId: firstMeal.id, userId: participantUser.id })
			.onConflictDoNothing({
				target: [eventAttendance.userId, eventAttendance.eventId]
			});
	}

	console.log(`Created or updated ${meals.length} meals`);
	return meals;
}
