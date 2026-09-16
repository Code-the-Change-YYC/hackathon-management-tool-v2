import { seedJudging } from "drizzle/seeds/judging";
import { seedMeals } from "drizzle/seeds/meals";
import { seedTeams } from "drizzle/seeds/teams";
import { seedUsers } from "drizzle/seeds/users";

async function main() {
	console.log("Starting seed...");

	try {
		const { adminUser, credentials, judges, participantUser } =
			await seedUsers();
		const teams = await seedTeams({ adminUser, participantUser });
		const meals = await seedMeals(participantUser);
		await seedJudging({ judges, teams });

		console.log("\nSeed completed successfully!\n");
		console.log("Summary:");
		console.log(`Admin user: ${credentials.adminEmail}`);
		console.log(`Organizations created or found: ${teams.length}`);
		console.log(`Meals created or updated: ${meals.length}`);
		console.log(`Participant user: ${credentials.participantEmail}`);
		console.log("\nLogin credentials:");
		console.log(`   Email: ${credentials.adminEmail}`);
		console.log(`   Password: ${credentials.adminPassword}`);
		console.log("Remember to change this email and password in production.");
		process.exit(0);
	} catch (error) {
		console.error("Seed failed:", error);
		process.exit(1);
	}
}

main();
