import { getEventDate } from "drizzle/seedUtils";
import { db } from "@/server/db";
import {
	hackathonSettings,
	judgingAssignments,
	judgingRoomStaff,
	judgingRooms,
	judgingRounds
} from "@/server/db/schema";
import { criteria, scores } from "@/server/db/scores-schema";
import type { Organization, User } from "@/types/types";

type SeedJudgingInput = {
	judges: User[];
	teams: Organization[];
};

export async function seedJudging({ judges, teams }: SeedJudgingInput) {
	console.log("\nCreating judging rounds...");

	const [round1] = await db
		.insert(judgingRounds)
		.values({
			name: "Preliminary Round",
			startTime: new Date(),
			endTime: new Date(Date.now() + 3600 * 1000)
		})
		.returning();

	const [round2] = await db
		.insert(judgingRounds)
		.values({
			name: "Finals",
			startTime: new Date(Date.now() + 7200 * 1000),
			endTime: new Date(Date.now() + 10800 * 1000)
		})
		.returning();

	if (round1) {
		console.log("\nCreating hackathon settings...");
		await db
			.insert(hackathonSettings)
			.values({
				id: 1,
				startDate: getEventDate(0, 8),
				endDate: getEventDate(1, 20),
				isActive: true,
				currentRoundId: round1.id
			})
			.onConflictDoUpdate({
				target: hackathonSettings.id,
				set: {
					startDate: getEventDate(0, 8),
					endDate: getEventDate(1, 20),
					isActive: true,
					currentRoundId: round1.id
				}
			});
	}

	console.log("\nCreating main criteria and sidepots...");
	const criteriaList = await db
		.insert(criteria)
		.values([
			{
				name: "Technical Execution",
				description:
					"Quality of the implementation (working prototype, technical depth, stability)? Use of appropriate technology stack. Is the solution technically sound and well-built?",
				displayOrder: 1,
				maxScore: 10,
				isSidepot: false
			},
			{
				name: "Innovation",
				description:
					"Is the idea original or a fresh take on existing solutions? Does it creatively apply technology to urban challenges (e.g., housing, mobility, disaster resilience, inclusivity)?",
				displayOrder: 2,
				maxScore: 10,
				isSidepot: false
			},
			{
				name: "Best use of AI",
				description:
					"How effectively does the solution use AI to address the challenge?",
				displayOrder: 3,
				maxScore: 5,
				isSidepot: true
			},
			{
				name: "Best UI",
				description:
					"Is the solution intuitive, accessible and user-friendly? Is the solution aesthetically pleasing? Does the design of the product elevate its function and original idea?",
				displayOrder: 4,
				maxScore: 5,
				isSidepot: true
			}
		])
		.returning();

	console.log("\nCreating judging assignments and random scores...");
	const rounds = [round1, round2].filter(
		(round): round is NonNullable<typeof round> => Boolean(round)
	);

	for (const round of rounds) {
		for (const judge of judges) {
			// Give each judge their own room in every round.
			const [room] = await db
				.insert(judgingRooms)
				.values({ roundId: round.id, roomLink: "https://zoom.us/" })
				.returning();

			if (!room) continue;

			await db.insert(judgingRoomStaff).values({
				roomId: room.id,
				staffId: judge.id
			});

			for (const team of teams) {
				const [assignment] = await db
					.insert(judgingAssignments)
					.values({
						teamId: team.id,
						roomId: room.id,
						timeSlot: new Date()
					})
					.returning();

				// Leave Team Six unscored so manual score creation can be tested.
				if (assignment && team.slug !== "team-6") {
					await db.insert(scores).values(
						criteriaList.map((criterion) => ({
							assignmentId: assignment.id,
							criteriaId: criterion.id,
							value: Math.floor(Math.random() * (criterion.maxScore + 1))
						}))
					);
				}
			}
		}
	}

	return { criteria: criteriaList, rounds };
}
