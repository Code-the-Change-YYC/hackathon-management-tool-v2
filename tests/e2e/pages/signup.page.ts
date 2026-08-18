import type { Page } from "playwright/test";
import type { createSignupData } from "../helpers/signup-data";

const SIGNUP_PAGE = "/signup";
const SUBMIT_BUTTON_NAME = "Sign up";

export class SignupPage {
	constructor(private readonly page: Page) {}

	async goto() {
		await this.page.goto(SIGNUP_PAGE);
	}

	async fillForm(data: ReturnType<typeof createSignupData>) {
		await this.page.getByLabel("*First Name").fill(data.firstName);
		await this.page.getByLabel("*Last Name").fill(data.lastName);
		await this.page.getByLabel("*Email").fill(data.email);
		await this.page.getByLabel("*Password").fill(data.password);
		await this.page
			.getByLabel("Which institution do you go to?")
			.selectOption(data.school);
		await this.page
			.getByLabel("Which program are you in?")
			.selectOption(data.program);
		await this.page
			.getByLabel("*Do you want provided food at the hackathon? (required)")
			.selectOption(data.wantsFood);
		await this.page
			.getByLabel(
				"*If you wanted provided food, please indicate any dietary restrictions:"
			)
			.selectOption(data.dietaryRestrictions);
	}

	async submit() {
		await this.page.getByRole("button", { name: SUBMIT_BUTTON_NAME }).click();
	}

	getErrorMessage() {
		return this.page.getByText("Please fill in all required fields.");
	}
}
