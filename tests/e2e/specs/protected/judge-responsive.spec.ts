import { Role } from "@/types/types";
import { expect, test } from "../../fixtures/judging.fixture";

test.use({
	hasTouch: true,
	authUserOptions: { role: Role.JUDGE, completedRegistration: true }
});
for (const viewport of [
	{ width: 360, height: 800 },
	{ width: 768, height: 1024 }
]) {
	test(`JUDGE07: long rubric controls work at ${viewport.width}x${viewport.height}`, async ({
		authenticatedPage: page,
		judgingFixture: fixture
	}) => {
		test.setTimeout(60_000);
		await page.setViewportSize(viewport);
		await page.goto(`/judge/score/${fixture.assignmentId}`);
		for (const [index, criterion] of fixture.criteria.entries()) {
			await expect(
				page.getByRole("heading", { name: criterion.name, exact: true })
			).toBeVisible();
			const options = page.getByRole("button", { name: /^\d+ points$/ });
			for (const option of await options.all()) {
				await option.scrollIntoViewIfNeeded();
				const box = await option.boundingBox();
				expect(box).not.toBeNull();
				expect(box?.x).toBeGreaterThanOrEqual(0);
				expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
					viewport.width
				);
				expect(box?.width).toBeGreaterThanOrEqual(44);
				expect(box?.height).toBeGreaterThanOrEqual(44);
				await option.tap();
				await expect(option).toHaveAttribute("aria-pressed", "true");
			}
			if (criterion.isSidepot) {
				const zero = page.getByRole("button", {
					name: "0 points",
					exact: true
				});
				await zero.focus();
				await page.keyboard.press("Space");
				await expect(zero).toHaveAttribute("aria-pressed", "true");
			}
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= window.innerWidth
				)
			).toBe(true);
			const next = page.getByRole("button", {
				name:
					index === fixture.criteria.length - 1
						? "Review scores"
						: "Next criterion",
				exact: true
			});
			await next.scrollIntoViewIfNeeded();
			await next.focus();
			await page.keyboard.press("Enter");
		}
		await expect(
			page.getByRole("button", { name: "Submit my scores", exact: true })
		).toBeEnabled();
		const toggle = page.getByRole("button", {
			name: "Toggle Sidebar",
			exact: true
		});
		if (await toggle.isVisible()) {
			await toggle.tap();
			await page.keyboard.press("Escape");
			await expect(toggle).toBeFocused();
		}
	});
}
