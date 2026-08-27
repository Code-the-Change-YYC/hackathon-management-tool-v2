import type { Page } from "playwright/test";
import type { createSignupData } from "../../utils/signup-data";

const SIGNUP_PAGE = "/signup";
const SUBMIT_BUTTON_NAME = "Complete registration";

const formatProgramName = (program: string) => program.replaceAll("_", " ");

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
		await this.selectOption("Which institution do you go to?", data.school);
		await this.selectOption(
			"Which program are you in?",
			formatProgramName(data.program)
		);
		await this.selectOption(
			"Do you want provided food at the hackathon?",
			data.wantsFood === "yes" ? "Yes" : "No"
		);
		for (const restriction of data.dietaryRestrictions) {
			await this.page
				.getByRole("checkbox", { name: restriction.replaceAll("_", " ") })
				.check();
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
