import { generateId } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { member, organization } from "@/server/db/auth-schema";
import {
	MEMBER_ROLES,
	type Organization,
	Role,
	type User
} from "@/types/types";
import { createOrGetUser } from "./users";

const TEAM_DEFINITIONS = [
	{ name: "Team One", slug: "team-1" },
	{ name: "Team Two", slug: "team-2" },
	{ name: "Team Three", slug: "team-3" },
	{ name: "Team Four", slug: "team-4" },
	{ name: "Team Five", slug: "team-5" },
	{ name: "Team Six", slug: "team-6" }
];

type SeedTeamsInput = {
	participantUser: User;
};

export async function seedTeams({
	participantUser
}: SeedTeamsInput): Promise<Organization[]> {
	console.log("\nCreating teams...");

	const teams: Organization[] = [];

	for (const definition of TEAM_DEFINITIONS) {
		const team = await db.transaction(async (tx) => {
			let team = await tx.query.organization.findFirst({
				where: eq(organization.slug, definition.slug)
			});

			if (!team) {
				[team] = await tx
					.insert(organization)
					.values({
						id: generateId(),
						name: definition.name,
						slug: definition.slug,
						createdAt: new Date()
					})
					.returning();
			}

			if (!team) {
				throw new Error(`Failed to create team: ${definition.name}`);
			}

			// Preserve existing owners, but repair teams left ownerless by earlier seeds.
			const existingOwner = await tx.query.member.findFirst({
				where: and(
					eq(member.organizationId, team.id),
					eq(member.role, MEMBER_ROLES.OWNER)
				)
			});

			if (!existingOwner) {
				// Stable, distinct accounts respect the one-team-per-user unique index.
				const owner = await createOrGetUser({
					email: `${definition.slug}-owner@hackathon.com`,
					password: process.env.PARTICIPANT_PASSWORD || "Password123!",
					name: `${definition.name} Owner`,
					role: Role.PARTICIPANT
				});
				const membership = await tx.query.member.findFirst({
					where: eq(member.userId, owner.id)
				});

				if (membership && membership.organizationId !== team.id) {
					throw new Error(
						`Cannot seed ${definition.name}: ${owner.email} already belongs to another team.`
					);
				}

				if (membership) {
					await tx
						.update(member)
						.set({ role: MEMBER_ROLES.OWNER })
						.where(eq(member.id, membership.id));
				} else {
					await tx.insert(member).values({
						id: generateId(),
						organizationId: team.id,
						userId: owner.id,
						role: MEMBER_ROLES.OWNER,
						createdAt: new Date()
					});
				}
			}

			return team;
		});

		teams.push(team);
		console.log(`Team ready: ${team.name}`);
	}

	const participantTeam = teams[0];
	if (participantTeam) {
		// Reseeding must not move a participant who has joined a different team.
		const existingMembership = await db.query.member.findFirst({
			where: eq(member.userId, participantUser.id)
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
