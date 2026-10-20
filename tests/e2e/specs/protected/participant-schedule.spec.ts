import { EventStatus, EventType, Role } from "@/types/types";
import { expect, test } from "../../fixtures/settings.fixture";

test.use({
	authUserOptions: { name: "Schedule Participant", role: Role.PARTICIPANT }
});

test("lists active events in the hackathon time zone and hides drafts", async ({
	authenticatedPage: page,
	createMeal
}) => {
	await createMeal({
		title: "Demo Day",
		location: "Room 101",
		type: EventType.ACTIVITY,
		status: EventStatus.ACTIVE,
		startTime: new Date("2099-06-15T18:00:00Z"),
		endTime: new Date("2099-06-15T19:30:00Z")
	});
	await createMeal({
		title: "Secret Draft",
		status: EventStatus.DRAFT,
		startTime: new Date("2099-06-15T18:00:00Z"),
		endTime: new Date("2099-06-15T19:30:00Z")
	});

	await page.goto("/participant/schedule");

	await expect(
		page.getByRole("heading", { name: "Monday, June 15" })
	).toBeVisible();
	const item = page.getByRole("listitem").filter({ hasText: "Demo Day" });
	await expect(item).toContainText("Room 101");
	await expect(item).toContainText("12:00 PM – 1:30 PM");
	await expect(page.getByText(/Secret Draft/)).toHaveCount(0);
});
