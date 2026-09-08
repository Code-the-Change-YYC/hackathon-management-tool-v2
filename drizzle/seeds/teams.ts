import { generateId } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { member, organization } from "@/server/db/auth-schema";
import { MEMBER_ROLES, type Organization, type User } from "@/types/types";

const TEAM_DEFINITIONS = [
	{ name: "Team One", slug: "team-1" },
	{ name: "Team Two", slug: "team-2" },
	{ name: "Team Three", slug: "team-3" },
	{ name: "Team Four", slug: "team-4" },
	{ name: "Team Five", slug: "team-5" },
	{ name: "Team Six", slug: "team-6" }
];

type SeedTeamsInput = {
	adminUser: User;
	participantUser: User;
};

export async function seedTeams({
	adminUser,
	participantUser
}: SeedTeamsInput): Promise<Organization[]> {
	console.log("\nCreating teams...");

	const teams: Organization[] = [];

	for (const definition of TEAM_DEFINITIONS) {
		try {
			const existingTeam = await db.query.organization.findFirst({
				where: eq(organization.slug, definition.slug)
			});

			if (existingTeam) {
				teams.push(existingTeam);
				console.log(`Team already exists: ${definition.name}`);
				continue;
			}

			const [newTeam] = await db
				.insert(organization)
				.values({
					id: generateId(),
					name: definition.name,
					slug: definition.slug,
					createdAt: new Date()
				})
				.returning();

			if (!newTeam) {
				console.error(`Failed to create team: ${definition.name}`);
				continue;
			}

			// Make the seeded admin the owner of every team.
			await db.insert(member).values({
				id: generateId(),
				organizationId: newTeam.id,
				userId: adminUser.id,
				role: MEMBER_ROLES.OWNER,
				createdAt: new Date()
			});

			teams.push(newTeam);
			console.log(`Created team: ${definition.name}`);
		} catch (error) {
			console.error(`Failed to create ${definition.name}:`, error);
		}
	}

	// Add the sample participant to the first team for member-facing test data.
	const participantTeam = teams[0];
	if (participantTeam) {
		const existingMembership = await db.query.member.findFirst({
			columns: { id: true },
			where: and(
				eq(member.organizationId, participantTeam.id),
				eq(member.userId, participantUser.id)
			)
		});

		if (!existingMembership) {
			await db.insert(member).values({
				id: generateId(),
				organizationId: participantTeam.id,
				userId: participantUser.id,
				role: MEMBER_ROLES.MEMBER,
				createdAt: new Date()
			});
			console.log(`Added participant to ${participantTeam.name}`);
		}
	}

	return teams;
}
