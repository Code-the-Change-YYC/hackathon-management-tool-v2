import type { Page } from "playwright/test";
import type { createSignupData } from "../helpers/signup-data";

const SIGNUP_PAGE = "/signup";

const dietaryRestrictionLabels: Record<string, string> = {
	dairy_free: "Dairy-free",
	gluten_free: "Gluten-free",
	halal: "Halal",
	nut_allergy: "Nut allergy",
	other: "Other",
	vegetarian: "Vegetarian",
	vegan: "Vegan"
};

export class SignupPage {
	constructor(private readonly page: Page) {}

	async goto() {
		await this.page.goto(SIGNUP_PAGE);
	}

	async fillForm(data: ReturnType<typeof createSignupData>) {
		await this.page.getByLabel("Email").fill(data.email);
		await this.page.getByLabel("Password", { exact: true }).fill(data.password);
		await this.page
			.getByRole("button", { exact: true, name: "Sign Up" })
			.click();
		await this.page.getByLabel("First name").fill(data.firstName);
		await this.page.getByLabel("Last name").fill(data.lastName);
		await this.selectOption(/Which institution are you attending/, data.school);
		await this.page.getByRole("button", { name: "Continue" }).click();
		await this.selectOption(
			/Do you want to be provided free meals at the hackathon/,
			data.wantsFood === "yes" ? "Yes" : "No"
		);
		for (const restriction of data.dietaryRestrictions) {
			await this.page
				.getByRole("button", {
					name: dietaryRestrictionLabels[restriction]
				})
				.click();
		}
	}

	async submit() {
		await this.page.getByRole("button", { name: "Continue" }).click();
	}

	private async selectOption(label: string | RegExp, option: string) {
		await this.page.getByLabel(label).click();
		await this.page.getByRole("option", { name: option, exact: true }).click();
	}
}
