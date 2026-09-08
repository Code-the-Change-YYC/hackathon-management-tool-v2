import type { Page } from "playwright/test";

export const mealInfoPath = "/participant/meal-info";
export const minute = 60_000;
export const description =
	"Show your meal ticket during this window to check in";
export const timeFormatter = new Intl.DateTimeFormat("en-US", {
	hour: "numeric",
	minute: "2-digit"
});
export const dateFormatter = new Intl.DateTimeFormat("en-US", {
	weekday: "long",
	month: "long",
	day: "numeric"
});
export const schedule = (page: Page) =>
	page.locator("section").filter({
		has: page.getByRole("heading", { name: "Meal Schedule", exact: true })
	});
