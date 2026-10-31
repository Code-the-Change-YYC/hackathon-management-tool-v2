import { inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { criteria } from "@/server/db/scores-schema";
import { assertE2EDatabaseSafety } from "../../db";
import { expect, test } from "../../fixtures/auth.fixture";

const seeded = [
	{
		id: crypto.randomUUID(),
		name: "Public innovation criterion",
		description: "Originality and useful execution.",
		maxScore: 10
	},
	{
		id: crypto.randomUUID(),
		name: "Public impact criterion",
		description: "Measurable benefit for the community.",
		maxScore: 10
	}
];
test.beforeEach(async () => {
	assertE2EDatabaseSafety();
	await db.insert(criteria).values(seeded);
});
test.afterEach(async () => {
	await db.delete(criteria).where(
		inArray(
			criteria.id,
			seeded.map(({ id }) => id)
		)
	);
});

test("PUB01: anonymous visitors see every published criterion and description", async ({
	page
}) => {
	const expected = await db.query.criteria.findMany();
	await page.goto("/");
	const section = page.locator("#judging-criteria");
	for (const criterion of expected) {
		await expect(
			section.getByRole("heading", { name: criterion.name, exact: true })
		).toBeVisible();
		if (criterion.description)
			await expect(
				section.getByText(criterion.description, { exact: true })
			).toBeVisible();
	}
	await expect(
		section.getByText("Judging criteria are currently unavailable.")
	).toHaveCount(0);
	await expect(page).toHaveURL(/\/$/);
});

test(
	"PUB03: the FAQ criteria link remains usable with a keyboard on a narrow screen",
	{ tag: "@responsive" },
	async ({ page }) => {
		await page.setViewportSize({ width: 360, height: 800 });
		await page.goto("/");
		const question = page.getByRole("button", {
			name: "How are the winners selected?"
		});
		await question.focus();
		await page.keyboard.press("Enter");
		const link = page.getByRole("link", {
			name: "judging criteria",
			exact: true
		});
		await link.focus();
		await expect(link).toBeFocused();
		await page.keyboard.press("Enter");
		await expect(page).toHaveURL(/#judging-criteria$/);
		const first = page.locator("#judging-criteria h3").first();
		await expect(first).toBeInViewport();
		const heading = page.locator("#judging-criteria h2");
		await expect(heading).toBeInViewport();
		await expect
			.poll(async () => {
				const [titleBox, headerBox] = await Promise.all([
					heading.boundingBox(),
					page.locator("header").first().boundingBox()
				]);
				return titleBox && headerBox
					? titleBox.y - headerBox.y - headerBox.height
					: -1;
			})
			.toBeGreaterThanOrEqual(0);
		await page.keyboard.press("Tab");
		await expect
			.poll(() => page.evaluate(() => document.activeElement?.tagName))
			.not.toBe("BODY");
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= window.innerWidth
			)
		).toBe(true);
	}
);
