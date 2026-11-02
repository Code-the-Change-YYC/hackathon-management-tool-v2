import { seedEvents } from "drizzle/seeds/events";
import { seedJudging } from "drizzle/seeds/judging";
import { resetDatabase } from "drizzle/seeds/reset";
import { seedTeams } from "drizzle/seeds/teams";
import { SAMPLE_EMAILS, SEED_PASSWORD, seedUsers } from "drizzle/seeds/users";
import { formatDateTime } from "@/lib/datetime";
import { EventType } from "@/types/types";

async function main() {
	console.log("Starting seed...");

	try {
		await resetDatabase();
		const { admin, judges, participants } = await seedUsers();
		const { teams, sampleTeam } = await seedTeams(participants);
		const events = await seedEvents(participants);
		const { mainRound, finalRound, submissionDeadline } = await seedJudging();

		const judge = judges.find((user) => user.email === SAMPLE_EMAILS.judge);
		const participant = participants.find(
			(user) => user.email === SAMPLE_EMAILS.participant
		);
		const mealCount = events.filter(
			(seededEvent) => seededEvent.type === EventType.FOOD
		).length;

		console.log("\nSeed completed successfully!\n");
		console.log("Summary:");
		console.log("Admins: 1");
		console.log(`Judges: ${judges.length}`);
		console.log(
			`Participants: ${participants.length} in ${teams.length} teams`
		);
		console.log(`Events: ${events.length} (${mealCount} meals)`);
		console.log(`Submission deadline: ${formatDateTime(submissionDeadline)}`);
		console.log(`${mainRound.name}: ${formatDateTime(mainRound.startTime)}`);
		console.log(`${finalRound.name}: ${formatDateTime(finalRound.startTime)}`);
		console.log(`\nLogins (password: ${SEED_PASSWORD}):`);
		console.log(`Admin: ${admin.email} (${admin.name})`);
		console.log(`Judge: ${judge?.email} (${judge?.name})`);
		console.log(
			`Participant: ${participant?.email} (${participant?.name}, owner of ${sampleTeam?.name})`
		);
		process.exit(0);
	} catch (error) {
		console.error("Seed failed:", error);
		process.exit(1);
	}
}

main();
