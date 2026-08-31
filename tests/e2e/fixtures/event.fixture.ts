import {
	type EventFixture,
	type EventFixtureInput,
	EventFixtureTracker
} from "../../utils/events";
import { test as base, expect } from "./auth.fixture";

type MealFixtures = {
	createMeal: (input: EventFixtureInput) => Promise<EventFixture>;
};

export const test = base.extend<MealFixtures>({
	// biome-ignore lint/correctness/noEmptyPattern: This fixture has no dependencies.
	createMeal: async ({}, use) => {
		const meals = new EventFixtureTracker();

		await use(async (input) => {
			return meals.create(input);
		});

		await meals.cleanup();
	}
});

export { expect };
