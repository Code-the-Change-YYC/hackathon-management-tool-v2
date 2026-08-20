import { expect, test } from "playwright/test";

test("login and registration pages offer Google sign-in", async ({ page }) => {
	await page.goto("/login");
	await expect(
		page.getByRole("button", { name: "Sign in with Google" })
	).toBeVisible();

	await page.goto("/signup");
	await expect(
		page.getByRole("button", { name: "Sign up with Google" })
	).toBeVisible();
});

test("Google sign-in starts the Better Auth social flow", async ({ page }) => {
	await page.route("**/api/auth/sign-in/social", async (route) => {
		await route.fulfill({
			json: {
				redirect: false,
				url: "http://127.0.0.1:3000/"
			}
		});
	});

	await page.goto("/login");
	const requestPromise = page.waitForRequest(
		(request) =>
			request.method() === "POST" &&
			request.url().includes("/api/auth/sign-in/social")
	);

	await page.getByRole("button", { name: "Sign in with Google" }).click();

	const request = await requestPromise;
	expect(request.postDataJSON()).toMatchObject({
		provider: "google",
		callbackURL: "/signup/event-details",
		newUserCallbackURL: "/signup/identity?provider=google"
	});
});
