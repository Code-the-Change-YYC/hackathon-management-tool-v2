import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { expect, test } from "../../fixtures/auth.fixture";

test("an authenticated incomplete user completes their own registration", async ({
	authenticatedPage,
	authUser
}) => {
	await authenticatedPage.goto("/signup/identity?provider=google");

	await authenticatedPage.getByLabel("First name").fill("Updated");
	await authenticatedPage.getByLabel("Last name").fill("Participant");
	await authenticatedPage
		.getByLabel(/Which institution are you attending/)
		.click();
	await authenticatedPage.getByRole("option", { name: "SAIT" }).click();
	await authenticatedPage.getByRole("button", { name: "Continue" }).click();

	await authenticatedPage
		.getByLabel(/Do you want to be provided free meals at the hackathon/)
		.click();
	await authenticatedPage.getByRole("option", { name: "Yes" }).click();
	await authenticatedPage.getByRole("button", { name: "Dairy-free" }).click();
	await authenticatedPage.getByRole("button", { name: "Nut allergy" }).click();
	await authenticatedPage
		.getByRole("button", { name: "Remove Dairy-free" })
		.click();
	await authenticatedPage.getByRole("button", { name: "Continue" }).click();

	await expect(authenticatedPage).toHaveURL(/\/$/);

	const savedUser = await db.query.user.findFirst({
		where: eq(user.id, authUser.id)
	});
	expect(savedUser).toMatchObject({
		completedRegistration: true,
		dietaryRestrictions: ["nut_allergy"],
		school: "SAIT",
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
