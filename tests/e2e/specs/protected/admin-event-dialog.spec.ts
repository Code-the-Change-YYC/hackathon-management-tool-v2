import { EventStatus, Role } from "@/types/types";
import { expect, test } from "../../fixtures/event.fixture";

test.use({
	authUserOptions: { completedRegistration: true, role: Role.ADMIN }
});

for (const mode of ["Add event", "Edit event"] as const) {
	test(`keeps the ${mode} heading and close button fixed while actions scroll`, async ({
		authenticatedPage: page,
		createMeal
	}) => {
		const event =
			mode === "Edit event"
				? await createMeal({
						title: "Scrollable event",
						status: EventStatus.DRAFT,
						startTime: new Date(Date.now() + 60_000),
						endTime: new Date(Date.now() + 3_600_000)
					})
				: null;
		await page.setViewportSize({ width: 390, height: 600 });
		await page.goto("/admin/schedule");
		if (event) {
			await page.getByRole("button", { name: `Manage ${event.title}` }).click();
			await page.getByRole("menuitem", { name: "Edit" }).click();
		} else {
			await page.getByRole("button", { name: "Add event" }).click();
		}

		const dialog = page.getByRole("dialog");
		const title = dialog.getByRole("heading", { name: mode });
		const action = dialog.getByRole("button", {
			name: mode === "Add event" ? "Add event" : "Save changes"
		});
		const cancel = dialog.getByRole("button", { name: "Cancel" });
		const fields = dialog.locator(".overflow-y-auto");
		const close = dialog.getByRole("button", { name: "Close" });
		await expect(title).toBeVisible();
		await expect(close).toBeVisible();
		const headerTop = (await title.boundingBox())?.y;
		const closeTop = (await close.boundingBox())?.y;
		const footerTop = (await action.boundingBox())?.y;
		const scrollTop = await fields.evaluate((element) => {
			element.scrollTop = element.scrollHeight;
			return element.scrollTop;
		});
		expect(scrollTop).toBeGreaterThan(0);
		expect((await title.boundingBox())?.y).toBe(headerTop);
		expect((await close.boundingBox())?.y).toBe(closeTop);
		expect((await action.boundingBox())?.y).toBeLessThan(footerTop ?? 0);
		await expect(action).toBeInViewport();
		await expect(cancel).toBeInViewport();
	});
}
