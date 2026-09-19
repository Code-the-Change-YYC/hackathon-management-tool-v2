import { inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { organization } from "@/server/db/auth-schema";
import { assertE2EDatabaseSafety } from "../e2e/db";

export type TeamFixture = typeof organization.$inferSelect;

function randomTeamCode() {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	return Array.from(
		{ length: 6 },
		() => alphabet[Math.floor(Math.random() * alphabet.length)]
	).join("");
}

export class TeamFixtureTracker {
	private readonly teamIds = new Set<string>();

	async create(name = "E2E Team"): Promise<TeamFixture> {
		assertE2EDatabaseSafety();

		const id = crypto.randomUUID();
		const [team] = await db
			.insert(organization)
			.values({
				id,
				name: `${name} ${id.slice(0, 8)}`,
				slug: `e2e-team-${id.slice(0, 8)}`,
				createdAt: new Date(),
				teamCode: randomTeamCode()
			})
			.returning();

		if (!team) {
			throw new Error("Failed to create a team fixture");
		}

		this.teamIds.add(team.id);
		return team;
	}

	async cleanup() {
		if (this.teamIds.size === 0) {
			return;
		}
		assertE2EDatabaseSafety();
		await db
			.delete(organization)
			.where(inArray(organization.id, [...this.teamIds]));
		this.teamIds.clear();
	}
}
