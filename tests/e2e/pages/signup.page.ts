import type { Page } from "playwright/test";
import type { createSignupData } from "../helpers/signup-data";

const SIGNUP_PAGE = "/signup";
const SUBMIT_BUTTON_NAME = "Complete registration";

export class SignupPage {
	constructor(private readonly page: Page) {}

	async goto() {
		await this.page.goto(SIGNUP_PAGE);
	}

	async fillForm(data: ReturnType<typeof createSignupData>) {
		await this.page
			.getByRole("button", { name: "Continue with email and password" })
			.click();
		await this.page.getByLabel("First name").fill(data.firstName);
		await this.page.getByLabel("Last name").fill(data.lastName);
		await this.page.getByLabel("Email").fill(data.email);
		await this.page.getByLabel("Password").fill(data.password);
		await this.page
			.getByRole("button", { name: "Continue to event details" })
			.click();
		await this.page
			.getByLabel("Which institution do you go to?")
			.selectOption(data.school);
		await this.page
			.getByLabel("Which program are you in?")
			.selectOption(data.program);
		await this.page
			.getByLabel("Do you want provided food at the hackathon?")
			.selectOption(data.wantsFood);
		for (const restriction of data.dietaryRestrictions) {
			await this.page.getByRole("checkbox", { name: restriction }).check();
		}
	}

	async submit() {
		await this.page.getByRole("button", { name: SUBMIT_BUTTON_NAME }).click();
	}
}
