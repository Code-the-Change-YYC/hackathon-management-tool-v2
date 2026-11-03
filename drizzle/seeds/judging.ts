import { addMinutes } from "date-fns";
import { getEventDate } from "drizzle/seedUtils";
import {
	DEFAULT_FINALIST_COUNT,
	MAIN_CRITERION_MAX_SCORE,
	MAX_PRESENTATION_MINUTES
} from "@/lib/judging";
import { db } from "@/server/db";
import { hackathonSettings } from "@/server/db/admin-schema";
import { judgingCriteria, judgingRounds } from "@/server/db/judging-schema";

const JUDGING_DELAY_MINUTES = 20;
const MAIN_JUDGING_MINUTES = 180;
const CHANGEOVER_MINUTES = 2;
const PANEL_SIZE = 2;

export async function seedJudging() {
	console.log("\nCreating judging rounds and criteria...");

	// No team has passed prescreening, so neither round has a schedule yet.
	const submissionDeadline = getEventDate(1, 12);
	const mainStart = addMinutes(submissionDeadline, JUDGING_DELAY_MINUTES);
	const mainEnd = addMinutes(mainStart, MAIN_JUDGING_MINUTES);
	// Finalists present at the closing ceremony.
	const finalStart = getEventDate(1, 16, 30);
	const rounds = await db
		.insert(judgingRounds)
		.values([
			{
				name: "Main Judging",
				kind: "panel",
				startTime: mainStart,
				endTime: mainEnd,
				panelSize: PANEL_SIZE,
				changeoverMinutes: CHANGEOVER_MINUTES
			},
			{
				name: "Final Round",
				kind: "final",
				startTime: finalStart,
				endTime: addMinutes(
					finalStart,
					DEFAULT_FINALIST_COUNT *
						(MAX_PRESENTATION_MINUTES + CHANGEOVER_MINUTES) -
						CHANGEOVER_MINUTES
				),
				presentationMinutes: MAX_PRESENTATION_MINUTES,
				changeoverMinutes: CHANGEOVER_MINUTES
			}
		])
		.returning();
	const mainRound = rounds.find((round) => round.kind === "panel");
	const finalRound = rounds.find((round) => round.kind === "final");
	if (!mainRound || !finalRound) {
		throw new Error("Failed to create judging rounds.");
	}

	await db.insert(hackathonSettings).values({
		id: 1,
		startDate: getEventDate(0, 8),
		endDate: getEventDate(1, 20),
		submissionDeadline,
		isActive: true
	});

	const criteria = await db
		.insert(judgingCriteria)
		.values([
			{
				name: "Innovation & Creativity",
				description:
					"Is the idea original or a fresh take on existing solutions? Does it apply technology in a creative way to the problem it tackles?",
				displayOrder: 1,
				maxScore: MAIN_CRITERION_MAX_SCORE,
				isSidepot: false
			},
			{
				name: "Impact & Relevance to Prompt",
				description:
					"Does the solution clearly address the hackathon prompt? Could it make a meaningful, positive difference for the people it serves?",
				displayOrder: 2,
				maxScore: MAIN_CRITERION_MAX_SCORE,
				isSidepot: false
			},
			{
				name: "Feasibility & Scalability",
				description:
					"Is the solution practical given real constraints (budget, infrastructure, etc.)? Could it scale beyond a demo into a real-world setting?",
				displayOrder: 3,
				maxScore: MAIN_CRITERION_MAX_SCORE,
				isSidepot: false
			},
			{
				name: "Technical Execution",
				description:
					"Quality of the implementation (working prototype, technical depth, stability). Use of appropriate technology stack. Is the solution technically sound and well-built?",
				displayOrder: 4,
				maxScore: MAIN_CRITERION_MAX_SCORE,
				isSidepot: false
			},
			{
				name: "User Experience & Design",
				description:
					"Is the solution intuitive, accessible and user-friendly? Is it aesthetically pleasing? Does the design of the product elevate its function and original idea?",
				displayOrder: 5,
				maxScore: MAIN_CRITERION_MAX_SCORE,
				isSidepot: false
			},
			{
				name: "Best use of AI",
				description:
					"How effectively does the solution use AI to address the challenge?",
				displayOrder: 6,
				maxScore: 5,
				isSidepot: true
			},
			{
				name: "Best UI",
				description:
					"Is the solution intuitive, accessible and user-friendly? Is the solution aesthetically pleasing? Does the design of the product elevate its function and original idea?",
				displayOrder: 7,
				maxScore: 5,
				isSidepot: true
			}
		])
		.returning();

	console.log(
		`Created ${rounds.length} judging rounds and ${criteria.length} criteria`
	);
	return { criteria, mainRound, finalRound, submissionDeadline };
}
