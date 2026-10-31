import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { session } from "@/server/db/auth-schema";
import {
	createTestUserWithPassword,
	getVerificationCode
} from "../../../utils/auth";
import { expect, test } from "../../fixtures/pages.fixture";

test("ACC02: unverified login resumes verification before granting a session", async ({
	page,
	loginPage
}) => {
	const password = "VerificationPassword123!";
	const owner = await createTestUserWithPassword(password, {
		emailVerified: false,
		completedRegistration: false
	});
	try {
		await loginPage.goto();
		await loginPage.fillFormAndSubmit({ email: owner.user.email, password });
		await expect(page).toHaveURL(/\/verify-email\?email=/);
		expect(new URL(page.url()).searchParams.get("email")).toBe(
			owner.user.email
		);
		expect(
			await db.query.session.findMany({
				where: eq(session.userId, owner.user.id)
			})
		).toHaveLength(0);
		await expect
			.poll(() => getVerificationCode(owner.user.email))
			.toMatch(/^\d{6}$/);
		const code = await getVerificationCode(owner.user.email);
		await page.getByLabel("One-time code").fill(code ?? "");
		await page.getByRole("button", { name: "Verify", exact: true }).click();
		await expect(page).toHaveURL(/\/onboarding\/personal-details$/);
	} finally {
		await owner.cleanup();
	}
});
