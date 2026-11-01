import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { hackathonSettings } from "@/server/db/admin-schema";
import { assertE2EDatabaseSafety } from "../db";
import { test as base, expect } from "./event.fixture";

type Settings = Partial<typeof hackathonSettings.$inferInsert>;

type SettingsFixtures = {
	setSettings: (values: Settings) => Promise<void>;
};

export const test = base.extend<SettingsFixtures>({
	// biome-ignore lint/correctness/noEmptyPattern: This fixture has no dependencies.
	setSettings: async ({}, use) => {
		assertE2EDatabaseSafety();
		const original = await db.query.hackathonSettings.findFirst();

		await use(async (values) => {
			await db
				.insert(hackathonSettings)
				.values({ id: 1, ...values })
				.onConflictDoUpdate({ target: hackathonSettings.id, set: values });
		});

		assertE2EDatabaseSafety();
		if (original) {
			await db
				.update(hackathonSettings)
				.set(original)
				.where(eq(hackathonSettings.id, 1));
		} else {
			await db.delete(hackathonSettings).where(eq(hackathonSettings.id, 1));
		}
	}
});

export { expect };
