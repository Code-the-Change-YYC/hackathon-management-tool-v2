import { DEVPOST_URL, DISCORD_URL } from "@/lib/constants";
import { Role } from "@/types/types";
import { expect, test } from "../../fixtures/settings.fixture";

const participantRoutes = [
	"/participant",
	"/participant/schedule",
	"/participant/team",
	"/participant/meals",
	"/participant/judging",
	"/participant/resources",
	"/participant/profile"
];

const daysFromNow = (days: number) =>
	new Date(Date.now() + days * 24 * 60 * 60_000);

test("unauthenticated visitors are redirected home", async ({
	page,
	setSettings
}) => {
	await setSettings({ startDate: daysFromNow(-1) });
	for (const route of participantRoutes) {
		await page.goto(route);
		await expect(page).toHaveURL(/\/$/);
	}
});

test.describe("judges", () => {
	test.use({
		authUserOptions: { completedRegistration: true, role: Role.JUDGE }
	});

	test("are redirected away from participant pages", async ({
		authenticatedPage: page,
		setSettings
	}) => {
		await setSettings({ startDate: daysFromNow(-1) });
		for (const route of participantRoutes) {
			await page.goto(route);
			await expect(page).toHaveURL(/\/$/);
		}
	});
});

test.describe("participants", () => {
	test.use({
		authUserOptions: { name: "Sidebar Participant", role: Role.PARTICIPANT }
	});

	test("sidebar links navigate between participant pages", async ({
		authenticatedPage: page,
		setSettings
	}) => {
		await setSettings({ startDate: daysFromNow(-1) });
		await page.goto("/participant");
		const nav = [
			["Schedule", /\/participant\/schedule$/],
			["Team", /\/participant\/team$/],
			["Meals", /\/participant\/meals$/],
			["Judging", /\/participant\/judging$/],
			["Resources", /\/participant\/resources$/],
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
		for (const [title, href] of [
			["Discord", DISCORD_URL],
			["Devpost", DEVPOST_URL]
		] as const) {
			const link = page.getByRole("link", { name: title, exact: true });
			await expect(link).toHaveAttribute("href", href);
			await expect(link).toHaveAttribute("target", "_blank");
		}
	});

	test("resources stay hidden until the hackathon starts", async ({
		authenticatedPage: page,
		setSettings
	}) => {
		await setSettings({ startDate: daysFromNow(1) });
		await page.goto("/participant");
		await expect(
			page.getByRole("link", { name: "Resources and Help", exact: true })
		).toHaveCount(0);

		await page.goto("/participant/resources");
		await expect(page).toHaveURL(/\/participant$/);
	});

	test("resources open once the hackathon starts", async ({
		authenticatedPage: page,
		setSettings
	}) => {
		await setSettings({ startDate: daysFromNow(-1) });
		await page.goto("/participant/resources");

		await expect(
			page.getByRole("heading", { name: "Resources and Help" })
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "Resources", exact: true })
		).toBeVisible();
		await expect(page.getByRole("heading", { name: "Mentors" })).toBeVisible();
	});
});
