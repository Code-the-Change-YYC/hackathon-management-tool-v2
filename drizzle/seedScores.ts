import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { organization, user } from "@/server/db/auth-schema";
import {
	hackathonSettings,
	judgingAssignments,
	judgingRounds
} from "@/server/db/schema";
import { criteria, scores } from "@/server/db/scores-schema";

async function main() {
	console.log("Starting scoring seed...");

	try {
		// Create judging round
		const roundId = crypto.randomUUID(); // Using crypto because better auth generateId was not working? Might need to read up a little more on better auth's generateId function, but this works for now
		await db.insert(judgingRounds).values({
			id: roundId,
			name: "Round 1",
			startTime: new Date(),
			endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
			createdAt: new Date(),
			updatedAt: new Date()
		});

		// Insert criteria into the actual hackathon_criteria table
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

		// Get judges
		const judges = await db.select().from(user).where(eq(user.role, "judge"));
		if (judges.length === 0) throw new Error("No judges found");

		// Get all teams
		const allTeams = await db.select().from(organization);
		if (allTeams.length === 0) throw new Error("No teams found");

		// Create assignments and scores
		for (const team of allTeams) {
			for (const judge of judges) {
				const assignmentId = crypto.randomUUID();
				await db.insert(judgingAssignments).values({
					id: assignmentId,
					judgeId: judge.id,
					teamId: team.id,
					roundId,
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
