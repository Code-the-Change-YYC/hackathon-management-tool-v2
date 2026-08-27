import {
	type MealFixture,
	type MealFixtureInput,
	MealFixtureTracker
} from "../../utils/meals";
import { test as base, expect } from "./auth.fixture";

type MealFixtures = {
	createMeal: (input: MealFixtureInput) => Promise<MealFixture>;
};

export const test = base.extend<MealFixtures>({
	// biome-ignore lint/correctness/noEmptyPattern: This fixture has no dependencies.
	createMeal: async ({}, use) => {
		const meals = new MealFixtureTracker();

		await use(async (input) => {
			return meals.create(input);
		});

		await meals.cleanup();
	}
});

export { expect };
