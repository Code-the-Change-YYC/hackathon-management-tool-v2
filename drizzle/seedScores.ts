import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { organization, user } from "@/server/db/auth-schema";
import {
	hackathonSettings,
	judgingAssignments,
	judgingRoomStaff,
	judgingRooms,
	judgingRounds
} from "@/server/db/schema";
import { criteria, scores } from "@/server/db/scores-schema";

async function main() {
	console.log("Starting scoring seed...");

	try {
		// Create judging round
		const roundId = crypto.randomUUID();
		await db.insert(judgingRounds).values({
			id: roundId,
			name: "Round 1",
			startTime: new Date(),
			endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
			createdAt: new Date(),
			updatedAt: new Date()
		});

		// Insert criteria
		const criteriaList = [
			{ name: "Innovation", maxScore: 10 },
			{ name: "Technical Complexity", maxScore: 10 },
			{ name: "Design", maxScore: 10 },
			{ name: "Presentation", maxScore: 10 }
		];

		const createdCriteria = [];
		for (const c of criteriaList) {
			const id = crypto.randomUUID();
			await db.insert(criteria).values({
				id,
				name: c.name,
				maxScore: c.maxScore,
				isSidepot: false
			});
			createdCriteria.push({ id, ...c });
		}

		// Get judges and teams
		const judges = await db.select().from(user).where(eq(user.role, "judge"));
		if (judges.length === 0) throw new Error("No judges found");

		const allTeams = await db.select().from(organization);
		if (allTeams.length === 0) throw new Error("No teams found");

		// Each judge gets their own room, all teams are assigned to each room
		for (const judge of judges) {
			const roomId = crypto.randomUUID();

			// Create a room for this judge
			await db.insert(judgingRooms).values({
				id: roomId,
				roundId,
				roomLink: `https://meet.example.com/room-${roomId}`,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			// Assign judge as staff for this room
			await db.insert(judgingRoomStaff).values({
				id: crypto.randomUUID(),
				roomId,
				staffId: judge.id,
				createdAt: new Date()
			});

			// Assign every team to this room and generate scores
			for (const team of allTeams) {
				const assignmentId = crypto.randomUUID();

				await db.insert(judgingAssignments).values({
					id: assignmentId,
					teamId: team.id,
					roomId,
					createdAt: new Date()
				});

				for (const c of createdCriteria) {
					const randomScore = Math.floor(Math.random() * (c.maxScore + 1));
					await db.insert(scores).values({
						id: crypto.randomUUID(),
						assignmentId,
						criteriaId: c.id,
						value: randomScore,
						createdAt: new Date()
					});
				}
			}
		}

		// Set active round in hackathon settings
		await db.update(hackathonSettings).set({ currentRoundId: roundId });

		console.log("Scoring seed completed successfully");
		process.exit(0);
	} catch (error) {
		console.error("Scoring seed failed:", error);
		process.exit(1);
	}
}

main();
