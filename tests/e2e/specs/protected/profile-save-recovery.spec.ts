import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { Role } from "@/types/types";
import { createTestUser } from "../../../utils/auth";
import { expect, test } from "../../fixtures/auth.fixture";

test.use({
	authUserOptions: {
		role: Role.PARTICIPANT,
		completedRegistration: true,
		firstName: "Profile",
		lastName: "Participant",
		name: "Profile Participant",
		age: 21,
		phoneNumber: "+14035550123",
		countryOfResidence: "CA",
		school: "SAIT",
		levelOfStudy: "undergraduate_three_plus_year",
		image: "/avatars/star.webp"
	}
});

for (const editor of ["personal details", "avatar"] as const) {
	test(`PART06: failed ${editor} saves retain drafts, cancel cleanly, and recover on retry`, async ({
		authenticatedPage: page,
		authUser
	}) => {
		const other = await createTestUser({
			firstName: "Other",
			image: "/avatars/flag.webp"
		});
		const avatar = editor === "avatar";
		const open = () =>
			page
				.getByRole("button", {
					name: avatar ? "Change avatar" : "Edit",
					exact: true
				})
				.click();
		const change = () =>
			avatar
				? page.getByRole("radio", { name: "Pizza", exact: true }).click()
				: page.getByLabel("First name", { exact: true }).fill("Changed");
		try {
			await page.goto("/participant/profile");
			await open();
			await change();
			await page.route(
				`**/api/trpc/users.${avatar ? "updateAvatar" : "updateProfile"}*`,
				(route) => route.abort("failed"),
				{ times: 1 }
			);
			await page
				.getByRole("button", { name: "Save changes", exact: true })
				.click();
			await expect(
				page.getByText(
					avatar
						? "We couldn't update your profile picture. Try again."
						: "We couldn't update your profile. Try again.",
					{ exact: true }
				)
			).toBeVisible();
			if (avatar)
				await expect(
					page.getByRole("radio", { name: "Pizza", exact: true })
				).toBeChecked();
			else
				await expect(
					page.getByLabel("First name", { exact: true })
				).toHaveValue("Changed");
			expect(
				await db.query.user.findFirst({ where: eq(user.id, authUser.id) })
			).toMatchObject({ firstName: "Profile", image: "/avatars/star.webp" });
			await page.getByRole("button", { name: "Cancel", exact: true }).click();
			await open();
			if (avatar)
				await expect(
					page.getByRole("radio", { name: "Star", exact: true })
				).toBeChecked();
			else
				await expect(
					page.getByLabel("First name", { exact: true })
				).toHaveValue("Profile");
			await change();
			await page
				.getByRole("button", { name: "Save changes", exact: true })
				.click();
			await expect(
				page.getByText(
					avatar ? "Profile picture was updated" : "Profile updated",
					{ exact: true }
				)
			).toBeVisible();
			expect(
				await db.query.user.findFirst({ where: eq(user.id, authUser.id) })
			).toMatchObject(
				avatar ? { image: "/avatars/pizza.webp" } : { firstName: "Changed" }
			);
			expect(
				await db.query.user.findFirst({ where: eq(user.id, other.user.id) })
			).toMatchObject({ firstName: "Other", image: "/avatars/flag.webp" });
		} finally {
			await other.cleanup();
		}
	});
}
