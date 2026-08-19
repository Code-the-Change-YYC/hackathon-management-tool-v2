import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { expect, test } from "../../fixtures/auth.fixture";

test("an authenticated incomplete user completes their own registration", async ({
	authenticatedPage,
	authUser
}) => {
	await authenticatedPage.goto("/signup/identity?provider=google");

	await expect(
		authenticatedPage.getByText("Your Google account is connected")
	).toBeVisible();
	await expect(authenticatedPage.getByLabel("Email")).toHaveAttribute(
		"readonly"
	);
	await expect(authenticatedPage.getByLabel("Password")).toHaveCount(0);
	await authenticatedPage.getByLabel("First name").fill("Updated");
	await authenticatedPage.getByLabel("Last name").fill("Participant");
	await authenticatedPage
		.getByRole("button", { name: "Continue to event details" })
		.click();

	await authenticatedPage
		.getByLabel("Which institution do you go to?")
		.selectOption("SAIT");
	await authenticatedPage
		.getByLabel("Which program are you in?")
		.selectOption("computer_science");
	await authenticatedPage
		.getByLabel("Do you want provided food at the hackathon?")
		.selectOption("yes");
	await authenticatedPage
		.getByRole("button", { name: "Complete registration" })
		.click();

	await expect(authenticatedPage).toHaveURL(/\/$/);

	const savedUser = await db.query.user.findFirst({
		where: eq(user.id, authUser.id)
	});
	expect(savedUser).toMatchObject({
		completedRegistration: true,
		school: "SAIT",
		program: "computer_science",
		name: "Updated Participant"
	});
});

test("registration completion rejects unauthenticated callers", async ({
	page
}) => {
	const response = await page.request.post(
		"/api/trpc/users.completeRegistration?batch=1",
		{
			headers: { "content-type": "application/json" },
			data: { 0: { json: { wantsFood: "yes" } } }
		}
	);

	expect(response.status()).toBe(401);
});

test("completed users bypass the registration wizard", async ({
	authenticatedPage,
	authUser
}) => {
	await db
		.update(user)
		.set({ completedRegistration: true })
		.where(eq(user.id, authUser.id));

	await authenticatedPage.goto("/signup");

	await expect(authenticatedPage).toHaveURL(/\/$/);
});
