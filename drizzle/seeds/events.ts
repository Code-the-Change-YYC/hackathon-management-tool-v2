import { addMinutes, differenceInMinutes, min, subDays } from "date-fns";
import { createRandom, getEventDate } from "drizzle/seedUtils";
import { DEVPOST_URL } from "@/lib/constants";
import { db } from "@/server/db";
import { event, eventAttendance } from "@/server/db/event-schema";
import { EventStatus, EventType, type User } from "@/types/types";

const MACEWAN_HALL_URL =
	"https://www.google.com/maps/search/?api=1&query=MacEwan+Hall+University+of+Calgary";
const ICT_BUILDING_URL =
	"https://www.google.com/maps/search/?api=1&query=ICT+Building+University+of+Calgary";

type ScheduledEvent = {
	title: string;
	description: string;
	type: EventType;
	location: string;
	navigationUrl?: string;
	day: number;
	start: [hour: number, minute: number];
	end: [hour: number, minute: number];
	status?: EventStatus;
	// Share of participants who check in. Meals only count those who want food.
	turnout?: number;
};

const EVENT_SCHEDULE: ScheduledEvent[] = [
	{
		title: "Check-in",
		description:
			"Pick up your badge and swag, then find a table for your team.",
		type: EventType.ACTIVITY,
		location: "MacEwan Hall Ballroom",
		navigationUrl: MACEWAN_HALL_URL,
		day: 0,
		start: [8, 0],
		end: [9, 30],
		turnout: 0.96
	},
	{
		title: "Breakfast and Coffee",
		description: "Bagels, fruit, yogurt and plenty of coffee.",
		type: EventType.FOOD,
		location: "MacEwan Hall Lounge",
		day: 0,
		start: [8, 0],
		end: [9, 30],
		turnout: 0.8
	},
	{
		title: "Opening Ceremony",
		description:
			"Meet the organizers and sponsors, hear this year's challenge, and get a rundown of the weekend.",
		type: EventType.CEREMONY,
		location: "MacEwan Hall Ballroom",
		navigationUrl: MACEWAN_HALL_URL,
		day: 0,
		start: [9, 30],
		end: [10, 30]
	},
	{
		title: "Hacking Begins",
		description:
			"The clock starts now. Head to your team's table and start building!",
		type: EventType.PROJECT,
		location: "MacEwan Hall Ballroom",
		day: 0,
		start: [10, 30],
		end: [10, 45]
	},
	{
		title: "Lunch: Burrito Bowls",
		description:
			"Build your own bowl with rice, beans, grilled chicken or tofu, and all the toppings.",
		type: EventType.FOOD,
		location: "MacEwan Hall Lounge",
		day: 0,
		start: [12, 0],
		end: [13, 30],
		turnout: 0.9
	},
	{
		title: "Workshop: Building with LLM APIs",
		description:
			"Go from an API key to a working prototype, with tips on prompting, streaming responses and keeping costs down.",
		type: EventType.ACTIVITY,
		location: "ICT 102",
		navigationUrl: ICT_BUILDING_URL,
		day: 0,
		start: [14, 30],
		end: [15, 30],
		turnout: 0.35
	},
	{
		title: "Mentor Office Hours",
		description:
			"Drop in with questions about your stack, your design or your pitch. Mentors are also on Discord all weekend.",
		type: EventType.ACTIVITY,
		location: "ICT 121",
		navigationUrl: ICT_BUILDING_URL,
		day: 0,
		start: [15, 0],
		end: [18, 0],
		turnout: 0.2
	},
	{
		title: "Dinner: Pizza Night",
		description: "Pizza for every diet, including vegan and gluten-free.",
		type: EventType.FOOD,
		location: "MacEwan Hall Lounge",
		day: 0,
		start: [18, 0],
		end: [19, 30],
		turnout: 0.9
	},
	{
		title: "Pancake Breakfast",
		description: "Pancakes, eggs and coffee to fuel the final stretch.",
		type: EventType.FOOD,
		location: "MacEwan Hall Lounge",
		day: 1,
		start: [8, 0],
		end: [9, 30],
		turnout: 0.75
	},
	{
		title: "Workshop: Pitching Your Project",
		description:
			"How to fit a problem, a demo and your impact into a short presentation that judges remember.",
		type: EventType.ACTIVITY,
		location: "ICT 102",
		navigationUrl: ICT_BUILDING_URL,
		day: 1,
		start: [10, 0],
		end: [10, 45],
		turnout: 0.3
	},
	{
		title: "Submissions Due",
		description:
			"Submit your project on Devpost by 11:30 AM. Late submissions won't be judged.",
		type: EventType.PROJECT,
		location: "Devpost",
		navigationUrl: DEVPOST_URL,
		day: 1,
		start: [11, 0],
		end: [11, 30]
	},
	{
		title: "Lunch: Shawarma Platters",
		description:
			"Chicken and falafel shawarma with rice, salad and garlic sauce.",
		type: EventType.FOOD,
		location: "MacEwan Hall Lounge",
		day: 1,
		start: [12, 0],
		end: [13, 30],
		turnout: 0.85
	},
	{
		title: "Closing Ceremony and Awards",
		description:
			"Watch the finalists present, then celebrate the winners of every prize.",
		type: EventType.CEREMONY,
		location: "MacEwan Hall Ballroom",
		navigationUrl: MACEWAN_HALL_URL,
		day: 1,
		start: [16, 30],
		end: [17, 30]
	},
	{
		title: "Closing Dinner",
		description: "One last meal together before heading home.",
		type: EventType.FOOD,
		location: "MacEwan Hall Lounge",
		day: 1,
		start: [17, 30],
		end: [19, 0],
		turnout: 0.7
	}
];

export async function seedEvents(participants: User[]) {
	console.log("\nCreating events and check-ins...");

	const random = createRandom(3);
	const now = new Date();

	const events = await db
		.insert(event)
		.values(
			EVENT_SCHEDULE.map((scheduledEvent) => {
				// Organizers set up the schedule a week or two ahead.
				const createdAt = subDays(now, random.int(7, 14));
				return {
					title: scheduledEvent.title,
					description: scheduledEvent.description,
					type: scheduledEvent.type,
					location: scheduledEvent.location,
					navigationUrl: scheduledEvent.navigationUrl ?? null,
					status: scheduledEvent.status ?? EventStatus.ACTIVE,
					startTime: getEventDate(scheduledEvent.day, ...scheduledEvent.start),
					endTime: getEventDate(scheduledEvent.day, ...scheduledEvent.end),
					createdAt,
					updatedAt: createdAt
				};
			})
		)
		.returning();

	// Only events that have already started have check-ins.
	const turnoutByTitle = new Map(
		EVENT_SCHEDULE.map((scheduledEvent) => [
			scheduledEvent.title,
			scheduledEvent.turnout ?? 0
		])
	);
	const attendance = events.flatMap((seededEvent) => {
		const turnout = turnoutByTitle.get(seededEvent.title) ?? 0;
		if (turnout === 0 || seededEvent.startTime > now) return [];

		const lastCheckIn = min([seededEvent.endTime, now]);
		const checkInMinutes = differenceInMinutes(
			lastCheckIn,
			seededEvent.startTime
		);
		const eligible =
			seededEvent.type === EventType.FOOD
				? participants.filter((participant) => participant.wantsFood)
				: participants;
		return eligible
			.filter(() => random.chance(turnout))
			.map((participant) => {
				const checkedInAt = addMinutes(
					seededEvent.startTime,
					random.int(0, checkInMinutes)
				);
				return {
					eventId: seededEvent.id,
					userId: participant.id,
					createdAt: checkedInAt,
					updatedAt: checkedInAt
				};
			});
	});
	if (attendance.length > 0) {
		await db.insert(eventAttendance).values(attendance);
	}

	console.log(
		`Created ${events.length} events with ${attendance.length} check-ins`
	);
	return events;
}
