import type { Page } from "playwright/test";
import type { createSignupData } from "../../utils/signup-data";

const SIGNUP_PAGE = "/signup";
const SUBMIT_BUTTON_NAME = "Continue";

const formatRestrictionName = (restriction: string) =>
	restriction === "gluten_free"
		? "Gluten-free"
		: restriction.charAt(0).toUpperCase() + restriction.slice(1);

export class SignupPage {
	constructor(private readonly page: Page) {}

	async goto() {
		await this.page.goto(SIGNUP_PAGE);
	}

	async fillForm(data: ReturnType<typeof createSignupData>) {
		await this.page.getByLabel("Email").fill(data.email);
		await this.page
			.getByRole("textbox", { name: "Password" })
			.fill(data.password);
		await this.page
			.getByRole("button", { name: "Sign Up", exact: true })
			.click();
		await this.page.waitForURL("/signup/identity");
		await this.page.getByLabel("First name").fill(data.firstName);
		await this.page.getByLabel("Last name").fill(data.lastName);
		await this.selectOption(
			"Which institution are you attending?*",
			data.school
		);
		await this.page
			.getByRole("button", { name: "Continue", exact: true })
			.click();
		await this.page.waitForURL("/signup/event-details");
		await this.selectOption(
			"Do you want to be provided free meals at the hackathon?*",
			data.wantsFood === "yes" ? "Yes" : "No"
		);
		for (const restriction of data.dietaryRestrictions) {
			await this.page
				.getByRole("button", {
					name: formatRestrictionName(restriction)
				})
				.click();
		}
	}

	private async selectOption(label: string, option: string) {
		await this.page.getByLabel(label).click();
		await this.page.getByRole("option", { name: option, exact: true }).click();
	}

	async submit() {
		await this.page.getByRole("button", { name: SUBMIT_BUTTON_NAME }).click();
	}
}
