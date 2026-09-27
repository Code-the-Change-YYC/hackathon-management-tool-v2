import { Role } from "@/types/types";
import { expect, test } from "../../fixtures/auth.fixture";

const participantRoutes = [
	"/participant",
	"/participant/schedule",
	"/participant/team",
	"/participant/meals",
	"/participant/judging",
	"/participant/resources",
	"/participant/profile"
];

test("unauthenticated visitors are redirected home", async ({ page }) => {
	for (const route of participantRoutes) {
		await page.goto(route);
		await expect(page).toHaveURL(/\/$/);
	}
});

test.describe("judges", () => {
	test.use({ authUserOptions: { role: Role.JUDGE } });

	test("are redirected away from participant pages", async ({
		authenticatedPage: page
	}) => {
		for (const route of participantRoutes) {
			await page.goto(route);
			await expect(page).toHaveURL(/\/$/);
		}
	});
});

test.describe("admins", () => {
	test.use({ authUserOptions: { role: Role.ADMIN } });

	test("can open participant pages", async ({ authenticatedPage: page }) => {
		await page.goto("/participant/profile");
		await expect(page).toHaveURL(/\/participant\/profile$/);
		await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
	});
});

test.describe("participants", () => {
	test.use({
		authUserOptions: { name: "Sidebar Participant", role: Role.PARTICIPANT }
	});

	test("sidebar links navigate between participant pages", async ({
		authenticatedPage: page
	}) => {
		await page.goto("/participant");
		const nav = [
			["Schedule", /\/participant\/schedule$/],
			["My Team", /\/participant\/team$/],
			["Meal Information", /\/participant\/meals$/],
			["Judging Information", /\/participant\/judging$/],
			["Resources and Help", /\/participant\/resources$/],
			["Dashboard", /\/participant$/]
		] as const;

		for (const [title, url] of nav) {
			await page.getByRole("link", { name: title, exact: true }).click();
			await expect(page).toHaveURL(url);
		}
	});

	test("external sidebar links open in a new tab", async ({
		authenticatedPage: page
	}) => {
		await page.goto("/participant");
		for (const title of ["Discord Join Link", "Hackathon Home"]) {
			await expect(
				page.getByRole("link", { name: title, exact: true })
			).toHaveAttribute("target", "_blank");
		}
	});
});
