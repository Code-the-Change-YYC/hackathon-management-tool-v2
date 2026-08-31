import { Role } from "@/types/types";
import { expect, test } from "../../fixtures/event.fixture";

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowAt = (hour: number) =>
	new Date(
		tomorrow.getFullYear(),
		tomorrow.getMonth(),
		tomorrow.getDate(),
		hour
	);
test.use({
	authUserOptions: {
		name: "Participant User",
		role: Role.PARTICIPANT
	}
});

test("participant sees their name and scheduled meals", async ({
	authUser,
	authenticatedPage,
	createMeal
}) => {
	const breakfast = await createMeal({
		startTime: tomorrowAt(9),
		endTime: tomorrowAt(10),
		title: "Participant breakfast"
	});
	const lunch = await createMeal({
		startTime: tomorrowAt(12),
		endTime: tomorrowAt(13),
		title: "Participant lunch"
	});

	await authenticatedPage.goto("/participant/meal-info");
	await expect(authenticatedPage.getByText(authUser.name)).toBeVisible();

	const scheduleItems = authenticatedPage.locator("ol h4");
	const renderedTitles = await scheduleItems.allTextContents();
	expect(renderedTitles).toContain(breakfast.title);
	expect(renderedTitles).toContain(lunch.title);
	expect(renderedTitles.indexOf(breakfast.title)).toBeLessThan(
		renderedTitles.indexOf(lunch.title)
	);
});
