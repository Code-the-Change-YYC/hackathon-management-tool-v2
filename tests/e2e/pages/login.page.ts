import type { Page } from "playwright/test";

const LOGIN_PAGE = "/login";
const SUBMIT_BUTTON_NAME = "Sign in";

export type LoginCredentials = {
	email: string;
	password: string;
};

export class LoginPage {
	constructor(private readonly page: Page) {}

	async goto() {
		await this.page.goto(LOGIN_PAGE);
	}

	async fillForm({ email, password }: LoginCredentials) {
		await this.page.getByLabel("Email").fill(email);
		await this.page.getByRole("textbox", { name: "Password" }).fill(password);
	}

	async submit() {
		await this.page
			.getByRole("button", { name: SUBMIT_BUTTON_NAME, exact: true })
			.click();
	}

	async fillFormAndSubmit(credentials: LoginCredentials) {
		await this.fillForm(credentials);
		await this.submit();
	}
}
