import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { event } from "@/server/db/event-schema";
import { EventStatus, EventType } from "@/types/types";
import { assertE2EDatabaseSafety } from "../db";
import { test as base, expect } from "./event.fixture";

export const test = base.extend<{ isolateMeals: undefined }>({
	// Meal queries are global. Temporarily hide seeded meals in the local test DB;
	// this fixture relies on the project's single-worker Playwright configuration.
	isolateMeals: [
		// biome-ignore lint/correctness/noEmptyPattern: Automatic fixture has no dependencies.
		async ({}, use) => {
			assertE2EDatabaseSafety();
			const existing = await db.query.event.findMany({
				where: and(
					eq(event.type, EventType.FOOD),
					eq(event.status, EventStatus.ACTIVE)
				)
			});
			try {
				if (existing.length) {
					await db
						.update(event)
						.set({ status: EventStatus.DRAFT })
						.where(
							inArray(
								event.id,
								existing.map((meal) => meal.id)
							)
						);
				}
				await use(undefined);
			} finally {
				assertE2EDatabaseSafety();
				for (const meal of existing) {
					await db
						.update(event)
						.set({ status: meal.status, updatedAt: meal.updatedAt })
						.where(eq(event.id, meal.id));
				}
			}
		},
		{ auto: true }
	]
});

export { expect };
