import { Role } from "@/types/types";
import { expect, test } from "../../fixtures/auth.fixture";

const routes = [
	["Schedule", "/admin/schedule"],
	["Users", "/admin/users"],
	["Teams", "/admin/teams"],
	["Meals", "/admin/meals"],
	["Judging Information", "/admin/judging"]
] as const;

test.describe("HMTV2-61 admin portal navigation", () => {
	test.use({
		authUserOptions: { role: Role.ADMIN, completedRegistration: true }
	});
	test("sidebar reaches every admin section and offers both portal views", async ({
		authenticatedPage: page
	}) => {
		await page.goto("/admin/schedule");
		for (const [label, path] of routes) {
			await page.getByRole("link", { name: label, exact: true }).click();
			await expect(page).toHaveURL(new RegExp(`${path}$`));
			await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		}
		await expect(
			page.getByRole("link", { name: "Participant Dashboard", exact: true })
		).toHaveAttribute("href", "/participant");
		await page
			.getByRole("link", { name: "Judge Dashboard", exact: true })
			.click();
		await expect(page).toHaveURL(/\/judge$/);
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	});
});

for (const role of [Role.PARTICIPANT, Role.JUDGE]) {
	test.describe(`HMTV2-61 ${role} access`, () => {
		test.use({ authUserOptions: { role, completedRegistration: true } });
		test("cannot enter any admin section through direct URLs", async ({
			authenticatedPage: page
		}) => {
			for (const [, path] of routes) {
				await page.goto(path);
				await expect(page).toHaveURL(/\/$/);
			}
		});
	});
}
