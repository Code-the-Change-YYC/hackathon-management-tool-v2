import { and, eq } from "drizzle-orm";
import type { Page } from "playwright/test";
import { db } from "@/server/db";
import { scores } from "@/server/db/scores-schema";
import { Role } from "@/types/types";
import { expect, test } from "../../fixtures/judging.fixture";

test.use({
	authUserOptions: { role: Role.JUDGE, completedRegistration: true }
});
type Rubric = { name: string; isSidepot: boolean }[];
async function complete(page: Page, rubric: Rubric) {
	for (const [index, criterion] of rubric.entries()) {
		await expect(
			page.getByRole("heading", { name: criterion.name, exact: true })
		).toBeVisible();
		await page
			.getByRole("button", {
				name: `${criterion.isSidepot ? 0 : 7} points`,
				exact: true
			})
			.click();
		await page
			.getByRole("button", {
				name: index === rubric.length - 1 ? "Review scores" : "Next criterion",
				exact: true
			})
			.click();
	}
}

for (const entry of ["/judge", "/judge/schedule"]) {
	test(`JUDGE01/JUDGE05: save and edit a real scorecard from ${entry}`, async ({
		authenticatedPage: page,
		authUser,
		judgingFixture: fixture
	}) => {
		const path = `/judge/score/${fixture.assignmentId}`;
		await page.goto(entry);
		await page.locator(`a[href="${path}"]`).first().click();
		await complete(page, fixture.criteria);
		await page
			.getByRole("button", { name: "Submit my scores", exact: true })
			.click();
		await expect(
			page.getByRole("heading", { name: "Your scores have been submitted" })
		).toBeVisible();
		const filter = and(
			eq(scores.assignmentId, fixture.assignmentId),
			eq(scores.judgeId, authUser.id)
		);
		const before = await db.query.scores.findMany({ where: filter });
		expect(before).toHaveLength(fixture.criteria.length);
		expect(before.filter((score) => score.value === 0)).toHaveLength(2);
		await page.goto(path);
		await expect(
			page.getByRole("button", { name: "7 points", exact: true })
		).toHaveAttribute("aria-pressed", "true");
		await page.getByRole("button", { name: "8 points", exact: true }).click();
		await page
			.getByRole("navigation", { name: "Scoring progress" })
			.getByRole("button", { name: "Review", exact: true })
			.click();
		await page
			.getByRole("button", { name: "Update my scores", exact: true })
			.click();
		await expect(
			page.getByRole("heading", { name: "Your scores have been submitted" })
		).toBeVisible();
		const after = await db.query.scores.findMany({ where: filter });
		for (const row of before)
			expect(after.find(({ id }) => id === row.id)?.value).toBe(
				row.criteriaId === fixture.criteria[0]?.id ? 8 : row.value
			);
		await page.goto(path);
		await expect(
			page.getByRole("button", { name: "8 points", exact: true })
		).toHaveAttribute("aria-pressed", "true");
		await page.goto("/judge");
		await expect(
			page.getByRole("link", { name: `Edit score for ${fixture.teamName}` })
		).toContainText("Scored");
	});
}

test("JUDGE02: both sidepots require an answer and explicit zero is retained", async ({
	authenticatedPage: page,
	judgingFixture: fixture
}) => {
	await page.goto(`/judge/score/${fixture.assignmentId}`);
	for (const criterion of fixture.criteria.filter((item) => !item.isSidepot)) {
		await page
			.getByRole("heading", { name: criterion.name, exact: true })
			.waitFor();
		await page.getByRole("button", { name: "7 points", exact: true }).click();
		await page
			.getByRole("button", { name: "Next criterion", exact: true })
			.click();
	}
	await page.getByRole("button", { name: "0 points", exact: true }).click();
	await page
		.getByRole("navigation", { name: "Scoring progress" })
		.getByRole("button", { name: "Review", exact: true })
		.click();
	await expect(
		page.getByRole("button", { name: "Submit my scores", exact: true })
	).toBeDisabled();
	const unanswered = fixture.criteria.filter(({ isSidepot }) => isSidepot)[1];
	await page
		.getByRole("button", { name: `Edit ${unanswered?.name}`, exact: true })
		.click();
	await page.getByRole("button", { name: "0 points", exact: true }).click();
	await page
		.getByRole("button", { name: "Review scores", exact: true })
		.click();
	await expect(
		page.getByRole("button", { name: "Submit my scores", exact: true })
	).toBeEnabled();
	await expect(page.getByText("0 / 5 points", { exact: true })).toHaveCount(2);
});

test("JUDGE03: retry retains answers and rapid clicks submit only once", async ({
	authenticatedPage: page,
	judgingFixture: fixture
}) => {
	await page.goto(`/judge/score/${fixture.assignmentId}`);
	await complete(page, fixture.criteria);
	let requests = 0;
	await page.route("**/api/trpc/scores.createMany*", async (route) => {
		requests++;
		if (requests === 1) await route.abort("failed");
		else {
			await new Promise((resolve) => setTimeout(resolve, 500));
			await route.continue();
		}
	});
	await page
		.getByRole("button", { name: "Submit my scores", exact: true })
		.click();
	await expect(page.getByText(/Your answers are still here/)).toBeVisible();
	await expect(page.getByText("7 / 10 points", { exact: true })).toHaveCount(2);
	await page
		.getByRole("button", { name: "Submit my scores", exact: true })
		.dblclick();
	await expect(
		page.getByRole("heading", { name: "Your scores have been submitted" })
	).toBeVisible();
	expect(requests).toBe(2);
});

test("JUDGE06: leaving and reloading restores a draft without submitting it", async ({
	authenticatedPage: page,
	judgingFixture: fixture
}) => {
	const path = `/judge/score/${fixture.assignmentId}`;
	await page.goto(path);
	await page.getByRole("button", { name: "7 points", exact: true }).click();
	await expect(
		page.getByText("Draft saved on this device · Not submitted")
	).toBeVisible();
	await page
		.locator(`a[href="/judge/schedule?round=${fixture.roundId}"]`)
		.click();
	await expect(page).toHaveURL(/\/judge\/schedule\?round=/);
	await page.goto(path);
	await expect(
		page.getByRole("button", { name: "7 points", exact: true })
	).toHaveAttribute("aria-pressed", "true");
	await page.reload();
	await expect(
		page.getByRole("button", { name: "7 points", exact: true })
	).toHaveAttribute("aria-pressed", "true");
	expect(
		await db.query.scores.findMany({
			where: eq(scores.assignmentId, fixture.assignmentId)
		})
	).toHaveLength(0);
});
