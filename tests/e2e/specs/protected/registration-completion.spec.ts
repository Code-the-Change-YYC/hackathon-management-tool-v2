import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { expect, test } from "../../fixtures/pages.fixture";

test.use({ authUserOptions: { completedRegistration: false, role: "user" } });

test("an incomplete user completes onboarding and registers", async ({
	authenticatedPage: page,
	authUser,
	onboardingPage
}) => {
	await page.goto("/onboarding");
	await expect(page).toHaveURL(/\/onboarding\/personal-details$/);

	await page.getByLabel("First name", { exact: true }).fill("Maria Anne");
	await page.getByLabel("Last name", { exact: true }).fill("De La Cruz");
	await page.getByLabel("Age", { exact: true }).fill("19");
	await page.getByLabel("Phone number", { exact: true }).fill("403-555-0123");
	await onboardingPage.searchAndChoose("Country of residence", "can", "Canada");
	await onboardingPage.searchAndChoose(
		"Which institution are you attending?",
		"calgary",
		"University of Calgary"
	);
	await onboardingPage.selectOption(
		"What is your current level of study?",
		"Undergraduate University (3+ year)"
	);
	await onboardingPage.selectOption(
		"What is your major?*",
		"Software Engineering"
	);
	await onboardingPage.continue();

	await expect(page).toHaveURL(/\/onboarding\/food-preferences$/);
	await onboardingPage.selectOption(
		"Do you want to be provided free meals at the hackathon?",
		"No"
	);
	await onboardingPage.continue();

	await expect(page).toHaveURL(/\/onboarding\/mlh-policies$/);
	await onboardingPage.continue();
	await expect(
		page.getByText("Agree to the MLH Code of Conduct to continue")
	).toBeVisible();
	await page.getByRole("checkbox", { name: /MLH Code of Conduct/ }).click();
	await page
		.getByRole("checkbox", { name: /share my application\/registration/ })
		.click();
	await onboardingPage.continue();

	await expect(page).toHaveURL(/\/onboarding\/discord$/);
	await page
		.getByRole("link", { name: "I’ve already joined, continue" })
		.click();
	await expect(page).toHaveURL(/\/onboarding\/team$/);
	await page.getByRole("radio", { name: "I don’t have a team yet." }).click();
	await onboardingPage.continue();

	await expect(page).toHaveURL(/\/onboarding\/team\/find$/);
	await page.getByRole("button", { name: "Complete registration" }).click();
	await expect(page).toHaveURL(/\/participant$/);

	const savedUser = await db.query.user.findFirst({
		where: eq(user.id, authUser.id)
	});
	expect(savedUser).toMatchObject({
		name: "Maria Anne De La Cruz",
		firstName: "Maria Anne",
		lastName: "De La Cruz",
		age: 19,
		// Canada is preselected, so the number is saved with its +1.
		phoneNumber: "+14035550123",
		countryOfResidence: "CA",
		school: "University of Calgary",
		levelOfStudy: "undergraduate_three_plus_year",
		program: "software_engineering",
		wantsFood: false,
		mlhCodeOfConductAcceptedAt: expect.any(Date),
		mlhDataSharingAcceptedAt: expect.any(Date),
		mlhEmailOptIn: false,
		completedRegistration: true,
		role: "participant"
	});
});

test("registration completion rejects unauthenticated callers", async ({
	page
}) => {
	const response = await page.request.post(
		"/api/trpc/users.completeRegistration?batch=1",
		{
			headers: { "content-type": "application/json" },
			data: { 0: { json: null } }
		}
	);

	expect(response.status()).toBe(401);
});

test.describe("once registered", () => {
	test.use({ authUserOptions: { completedRegistration: true } });

	test("users skip sign-up and onboarding for their dashboard", async ({
		authenticatedPage: page
	}) => {
		await page.goto("/signup");
		await expect(page).toHaveURL(/\/participant$/);

		await page.goto("/onboarding/personal-details");
		await expect(page).toHaveURL(/\/participant$/);
	});
});
