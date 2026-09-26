import { type TeamFixture, TeamFixtureTracker } from "../../utils/teams";
import { test as base, expect } from "./auth.fixture";

type TeamFixtures = {
	createTeam: (name?: string) => Promise<TeamFixture>;
};

export const test = base.extend<TeamFixtures>({
	// biome-ignore lint/correctness/noEmptyPattern: This fixture has no dependencies.
	createTeam: async ({}, use) => {
		const teams = new TeamFixtureTracker();
		await use((name) => teams.create(name));
		await teams.cleanup();
	}
});

export { expect };
