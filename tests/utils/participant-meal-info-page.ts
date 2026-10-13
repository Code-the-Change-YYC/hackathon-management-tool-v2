import type { Page } from "playwright/test";

export const mealInfoPath = "/participant/meals";
export const minute = 60_000;
export const description =
	"Show your meal ticket during this window to check in";
export const schedule = (page: Page) =>
	page.locator("section").filter({
		has: page.getByRole("heading", { name: "Meal Schedule", exact: true })
	});
