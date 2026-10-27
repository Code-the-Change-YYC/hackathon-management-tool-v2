import { addMinutes } from "date-fns";
import { getEventDate } from "drizzle/seedUtils";
import { MAIN_CRITERION_MAX_SCORE } from "@/lib/judging";
import { db } from "@/server/db";
import { hackathonSettings } from "@/server/db/admin-schema";
import {
	judgingAssignments,
	judgingCriteria,
	judgingRounds,
	judgingScores,
	judgingTableJudges,
	judgingTables
} from "@/server/db/judging-schema";
import type { Organization, User } from "@/types/types";

type SeedJudgingInput = {
	judges: User[];
	teams: Organization[];
};

const PANEL_PRESENTATION_MINUTES = 8;
const FINAL_PRESENTATION_MINUTES = 10;
const CHANGEOVER_MINUTES = 2;
const FINALIST_COUNT = 5;

function randomScore(criterion: typeof judgingCriteria.$inferSelect) {
	return criterion.isSidepot
		? Math.floor(Math.random() * (criterion.maxScore + 1))
		: 1 + Math.floor(Math.random() * criterion.maxScore);
}

export async function seedJudging({ judges, teams }: SeedJudgingInput) {
	console.log("\nCreating judging rounds...");

	const panelSize = judges.length >= 4 ? 2 : 1;
	const panelStart = new Date();
	const [panelRound] = await db
		.insert(judgingRounds)
		.values({
			name: "Panel Round",
			kind: "panel",
			startTime: panelStart,
			endTime: addMinutes(panelStart, 180),
			publishedAt: new Date(),
			panelSize,
			presentationMinutes: PANEL_PRESENTATION_MINUTES,
			changeoverMinutes: CHANGEOVER_MINUTES
		})
		.returning();

	const finalStart = addMinutes(panelStart, 240);
	const [finalRound] = await db
		.insert(judgingRounds)
		.values({
			name: "Final Round",
			kind: "final",
			startTime: finalStart,
			endTime: addMinutes(finalStart, 60),
			publishedAt: new Date(),
			presentationMinutes: FINAL_PRESENTATION_MINUTES,
			changeoverMinutes: CHANGEOVER_MINUTES
		})
		.returning();

	if (!panelRound || !finalRound) {
		throw new Error("Failed to create judging rounds.");
	}

	console.log("\nCreating hackathon settings...");
	await db
		.insert(hackathonSettings)
		.values({
			id: 1,
			startDate: getEventDate(0, 8),
			endDate: getEventDate(1, 20),
			isActive: true,
			currentRoundId: panelRound.id
		})
		.onConflictDoUpdate({
			target: hackathonSettings.id,
			set: {
				startDate: getEventDate(0, 8),
				endDate: getEventDate(1, 20),
				isActive: true,
				currentRoundId: panelRound.id
			}
		});

	console.log("\nCreating main criteria and sidepots...");
	const criteriaList = await db
		.insert(judgingCriteria)
		.values([
			{
				name: "Technical Execution",
				description:
					"Quality of the implementation (working prototype, technical depth, stability)? Use of appropriate technology stack. Is the solution technically sound and well-built?",
				displayOrder: 1,
				maxScore: MAIN_CRITERION_MAX_SCORE,
				isSidepot: false
			},
			{
				name: "Innovation",
				description:
					"Is the idea original or a fresh take on existing solutions? Does it creatively apply technology to urban challenges (e.g., housing, mobility, disaster resilience, inclusivity)?",
				displayOrder: 2,
				maxScore: MAIN_CRITERION_MAX_SCORE,
				isSidepot: false
			},
			{
				name: "Best use of AI",
				description:
					"How effectively does the solution use AI to address the challenge?",
				displayOrder: 3,
				maxScore: 5,
				isSidepot: true,
				roundIds: [panelRound.id]
			},
			{
				name: "Best UI",
				description:
					"Is the solution intuitive, accessible and user-friendly? Is the solution aesthetically pleasing? Does the design of the product elevate its function and original idea?",
				displayOrder: 4,
				maxScore: 5,
				isSidepot: true,
				roundIds: [panelRound.id]
			}
		])
		.returning();

	console.log("\nCreating panel tables, assignments and random scores...");
	const tableCount = Math.floor(judges.length / panelSize);
	if (tableCount < 2) {
		throw new Error("Panel judging needs enough judges for two tables.");
	}

	const panelTables = await db
		.insert(judgingTables)
		.values(
			Array.from({ length: tableCount }, (_, index) => ({
				roundId: panelRound.id,
				tableNumber: index + 1
			}))
		)
		.returning();

	// Spread extra judges one per table so panel size stays a minimum.
	const panelTableJudges = judges.map((judge, index) => ({
		tableId: panelTables[index % tableCount]?.id ?? "",
		judgeId: judge.id
	}));
	await db.insert(judgingTableJudges).values(panelTableJudges);

	// Each wave of teams presents back-to-back at two different tables.
	const slotMinutes = PANEL_PRESENTATION_MINUTES + CHANGEOVER_MINUTES;
	const panelAssignments = teams.flatMap((team, index) => {
		const wave = Math.floor(index / tableCount);
		const position = index % tableCount;
		const offset = (wave % (tableCount - 1)) + 1;
		const firstSlotStart = addMinutes(panelStart, wave * 2 * slotMinutes);
		return [
			{
				teamId: team.id,
				tableId: panelTables[position]?.id ?? "",
				startsAt: firstSlotStart
			},
			{
				teamId: team.id,
				tableId: panelTables[(position + offset) % tableCount]?.id ?? "",
				startsAt: addMinutes(firstSlotStart, slotMinutes)
			}
		];
	});
	const createdAssignments = await db
		.insert(judgingAssignments)
		.values(panelAssignments)
		.returning();

	// Leave Team Six unscored so manual score creation can be tested.
	const teamSix = teams.find((team) => team.slug === "team-6");
	const panelScores = createdAssignments
		.filter((assignment) => assignment.teamId !== teamSix?.id)
		.flatMap((assignment) =>
			panelTableJudges
				.filter((tableJudge) => tableJudge.tableId === assignment.tableId)
				.flatMap(({ judgeId }) =>
					criteriaList.map((criterion) => ({
						assignmentId: assignment.id,
						judgeId,
						criteriaId: criterion.id,
						value: randomScore(criterion)
					}))
				)
		);
	if (panelScores.length > 0) {
		await db.insert(judgingScores).values(panelScores);
	}

	console.log("\nCreating final round table and unscored finalists...");
	const [finalTable] = await db
		.insert(judgingTables)
		.values({ roundId: finalRound.id, tableNumber: 1 })
		.returning();
	if (!finalTable) throw new Error("Failed to create the final table.");

	await db
		.insert(judgingTableJudges)
		.values(
			judges.map((judge) => ({ tableId: finalTable.id, judgeId: judge.id }))
		);

	const finalSlotMinutes = FINAL_PRESENTATION_MINUTES + CHANGEOVER_MINUTES;
	const finalists = teams.slice(0, FINALIST_COUNT);
	if (finalists.length > 0) {
		await db.insert(judgingAssignments).values(
			finalists.map((team, index) => ({
				teamId: team.id,
				tableId: finalTable.id,
				startsAt: addMinutes(finalStart, index * finalSlotMinutes)
			}))
		);
	}

	return { criteria: criteriaList, rounds: [panelRound, finalRound] };
}
