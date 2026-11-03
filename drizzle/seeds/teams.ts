import { generateId } from "better-auth";
import { addMinutes, max, min, subMinutes } from "date-fns";
import { TEAM_NAMES } from "drizzle/seeds/names";
import { SAMPLE_EMAILS } from "drizzle/seeds/users";
import { createRandom, type Random } from "drizzle/seedUtils";
import { TEAM_CODE_LENGTH } from "@/lib/validation/team";
import { db } from "@/server/db";
import { member, organization } from "@/server/db/auth-schema";
import { MEMBER_ROLES, type User } from "@/types/types";

const TEAM_CODE_CHARACTERS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"];
const MAX_TEAM_SIZE = 5;
const MINUTES_PER_DAY = 24 * 60;

// Most teams fill up to four. Teams need between two and five members.
const TEAM_SIZE_WEIGHTS = [
	[2, 10],
	[3, 25],
	[4, 45],
	[5, 20]
] as const;

function planTeamSizes(random: Random, participantCount: number) {
	const sizes: number[] = [];
	let remaining = participantCount;
	while (remaining > 0) {
		const size = Math.min(remaining, random.weighted(TEAM_SIZE_WEIGHTS));
		sizes.push(size);
		remaining -= size;
	}
	// A leftover participant joins a team with room instead of hacking alone.
	if (sizes.at(-1) === 1) {
		sizes.pop();
		const index = sizes.findIndex((size) => size < MAX_TEAM_SIZE);
		sizes[index] = (sizes[index] ?? 0) + 1;
	}
	return sizes;
}

// Matches the slugs the app gives new teams.
function createSlug(random: Random, name: string) {
	const slug = name
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "");
	return `${slug}-${random.int(0, 0xffff).toString(16).padStart(4, "0")}`;
}

function createTeamCode(random: Random, taken: Set<string>) {
	let code: string;
	do {
		code = Array.from({ length: TEAM_CODE_LENGTH }, () =>
			random.pick(TEAM_CODE_CHARACTERS)
		).join("");
	} while (taken.has(code));
	taken.add(code);
	return code;
}

export async function seedTeams(participants: User[]) {
	console.log("\nCreating teams...");

	const random = createRandom(2);
	const now = new Date();

	// The sample participant owns the first team, so that login can manage it.
	const isSample = (participant: User) =>
		participant.email === SAMPLE_EMAILS.participant;
	const queue = [
		...participants.filter(isSample),
		...random.shuffle(
			participants.filter((participant) => !isSample(participant))
		)
	];
	const sizes = planTeamSizes(random, queue.length);
	const teamNames = random.shuffle(TEAM_NAMES);
	if (sizes.length > teamNames.length) {
		throw new Error(
			`${sizes.length} teams need names, but there are only ${teamNames.length}.`
		);
	}

	const teamCodes = new Set<string>();
	const newTeams: (typeof organization.$inferInsert)[] = [];
	const newMembers: (typeof member.$inferInsert)[] = [];
	for (const [index, size] of sizes.entries()) {
		const members = queue.splice(0, size);
		const owner = members[0];
		const name = teamNames[index];
		if (!owner || !name) throw new Error("Ran out of participants or names.");

		const teamId = generateId();
		const createdAt = min([
			addMinutes(owner.createdAt, random.int(10, 3 * MINUTES_PER_DAY)),
			subMinutes(now, 30)
		]);
		newTeams.push({
			id: teamId,
			name,
			slug: createSlug(random, name),
			teamCode: createTeamCode(random, teamCodes),
			createdAt
		});

		for (const participant of members) {
			const isOwner = participant === owner;
			newMembers.push({
				id: generateId(),
				organizationId: teamId,
				userId: participant.id,
				role: isOwner ? MEMBER_ROLES.OWNER : MEMBER_ROLES.MEMBER,
				// Teammates join with the team code once they've signed up.
				createdAt: isOwner
					? createdAt
					: min([
							addMinutes(
								max([participant.createdAt, createdAt]),
								random.int(5, 2 * MINUTES_PER_DAY)
							),
							subMinutes(now, 5)
						])
			});
		}
	}

	const teams = await db.insert(organization).values(newTeams).returning();
	await db.insert(member).values(newMembers);

	const sampleTeam = teams.find((team) => team.id === newTeams[0]?.id);
	console.log(`Created ${teams.length} teams`);
	return { teams, sampleTeam };
}
