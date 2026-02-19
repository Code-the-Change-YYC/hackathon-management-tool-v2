import { generateId } from "better-auth";
import { createOrGetUser } from "drizzle/seedUtils";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { member, organization } from "@/server/db/auth-schema";

async function main() {
	console.log("Starting seed...");

	const adminEmail = process.env.ADMIN_EMAIL || "admin@hackathon.com";
	const adminPassword = process.env.ADMIN_PASSWORD || "Password123!";
	const adminName = process.env.ADMIN_NAME || "Admin User";

	const judgeEmail = process.env.JUDGE_EMAIL || "judge@hackathon.com";
	const judgePassword = process.env.JUDGE_PASSWORD || "Password123!";
	const judgeName = process.env.JUDGE_NAME || "Judge User";

	const participantEmail =
		process.env.PARTICIPANT_EMAIL || "participant@hackathon.com";
	const participantPassword =
		process.env.PARTICIPANT_PASSWORD || "Password123!";
	const participantName = process.env.PARTICIPANT_NAME || "Participant User";

	try {
		console.log("Creating admin user...");

		const adminUser = await createOrGetUser({
			email: adminEmail,
			password: adminPassword,
			name: adminName,
			role: "admin"
		});

		await createOrGetUser({
			email: judgeEmail,
			password: judgePassword,
			name: judgeName,
			role: "judge"
		});

		await createOrGetUser({
			email: participantEmail,
			password: participantPassword,
			name: participantName,
			role: "participant"
		});

		console.log("\nCreating organizations...");

		const orgs = [
			{ name: "Admins", slug: "admins" },
			{ name: "Drivers", slug: "drivers" },
			{ name: "Team One", slug: "team-one" },
			{ name: "Team Two", slug: "team-two" },
			{ name: "Team Three", slug: "team-three" }
		];

		for (const org of orgs) {
			try {
				// Check if organization already exists
				const existingOrg = await db
					.select()
					.from(organization)
					.where(eq(organization.slug, org.slug))
					.limit(1);

				if (existingOrg.length > 0) {
					console.log(`Team already exists: ${org.name}`);
					continue;
				}

				// Create organization directly in database
				const [newOrg] = await db
					.insert(organization)
					.values({
						id: generateId(),
						name: org.name,
						slug: org.slug,
						createdAt: new Date()
					})
					.returning();

				// Add admin user as owner of the organization
				if (newOrg?.id) {
					await db.insert(member).values({
						id: generateId(),
						organizationId: newOrg.id,
						userId: adminUser.id,
						role: "owner",
						createdAt: new Date()
					});

					console.log(
						`Created organization: ${org.name} (admin added as owner)`
					);
				} else {
					console.error(
						`Failed to create member for organization: ${org.name} (organization not created)`
					);
				}
			} catch (error) {
				console.error(`Failed to create ${org.name}:`, error);
			}
		}

		// ==================== SUMMARY ====================
		console.log("\nSeed completed successfully!\n");
		console.log("Summary:");
		console.log(`Admin user: ${adminEmail}`);
		console.log(`Organizations created: ${orgs.length}`);
		console.log("\nLogin credentials:");
		console.log(`   Email: ${adminEmail}`);
		console.log(`   Password: ${adminPassword}`);
		console.log("remember to change this email in prod");

		process.exit(0);
	} catch (error) {
		console.error("Seed failed:", error);
		process.exit(1);
	}
}

main();
