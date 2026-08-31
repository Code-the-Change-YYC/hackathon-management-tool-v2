import {
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	onTestFinished
} from "vitest";
import { assertE2EDatabaseSafety } from "../../e2e/db";
import { EventFixtureTracker } from "../../utils/events";
import {
	createAuthenticatedCaller,
	createUnauthenticatedCaller
} from "../helpers/auth";

const hour = 60 * 60 * 1000;

describe("meals.getAllMeals", () => {
	let mealFixtures: EventFixtureTracker;

	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	afterEach(async () => {
		await mealFixtures?.cleanup();
	});

	it("rejects callers without a session", async () => {
		const caller = createUnauthenticatedCaller();

		await expect(caller.meals.getAllMeals()).rejects.toMatchObject({
			code: "UNAUTHORIZED"
		});
	});

	it("returns the tracked meals in chronological order", async () => {
		mealFixtures = new EventFixtureTracker();
		const startTime = Date.now() + 24 * hour;
		const laterMeal = await mealFixtures.create({
			endTime: new Date(startTime + 3 * hour),
			startTime: new Date(startTime + 2 * hour),
			title: "Later meal"
		});
		const earlierMeal = await mealFixtures.create({
			endTime: new Date(startTime + hour),
			startTime: new Date(startTime),
			title: "Earlier meal"
		});
		const { caller, cleanup } = await createAuthenticatedCaller();
		onTestFinished(cleanup);

		const meals = await caller.meals.getAllMeals();
		const trackedIds = new Set([earlierMeal.id, laterMeal.id]);
		const trackedMeals = meals.filter((meal) => trackedIds.has(meal.id));

		expect(trackedMeals.map((meal) => meal.id)).toEqual([
			earlierMeal.id,
			laterMeal.id
		]);
	});
});
