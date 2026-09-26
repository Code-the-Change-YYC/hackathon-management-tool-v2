import type { Page } from "playwright/test";
import { LONG_DATE_FORMATTER, TIME_FORMATTER } from "@/lib/datetime";

export const mealInfoPath = "/participant/meals";
export const minute = 60_000;
export const description =
	"Show your meal ticket during this window to check in";
export const timeFormatter = TIME_FORMATTER;
export const dateFormatter = LONG_DATE_FORMATTER;
export const schedule = (page: Page) =>
	page.locator("section").filter({
		has: page.getByRole("heading", { name: "Meal Schedule", exact: true })
	});
