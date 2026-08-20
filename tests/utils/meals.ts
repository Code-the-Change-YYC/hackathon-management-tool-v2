import { inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { meal } from "@/server/db/meal-schema";
import { assertE2EDatabaseSafety } from "../e2e/db";

export type MealFixtureInput = Pick<
	typeof meal.$inferInsert,
	"endTime" | "startTime" | "title"
>;

export type MealFixture = typeof meal.$inferSelect;

export class MealFixtureTracker {
	private readonly mealIds = new Set<string>();

	async create(input: MealFixtureInput): Promise<MealFixture> {
		assertE2EDatabaseSafety();

		const [createdMeal] = await db
			.insert(meal)
			.values({
				...input,
				title: `test-meal-${crypto.randomUUID()} ${input.title}`
			})
			.returning();

		if (!createdMeal) {
			throw new Error("Failed to create a meal fixture");
		}

		this.mealIds.add(createdMeal.id);
		return createdMeal;
	}

	async cleanup() {
		if (this.mealIds.size === 0) {
			return;
		}

		assertE2EDatabaseSafety();
		await db.delete(meal).where(inArray(meal.id, [...this.mealIds]));
		this.mealIds.clear();
	}
}
