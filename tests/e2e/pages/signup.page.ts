import type { Page } from "playwright/test";
import type { LoginCredentials } from "./login.page";

const SIGNUP_PAGE = "/signup";

export class SignupPage {
	constructor(private readonly page: Page) {}

	async goto() {
		await this.page.goto(SIGNUP_PAGE);
	}

	async signUp({ email, password }: LoginCredentials) {
		await this.page.getByLabel("Email").fill(email);
		await this.page.getByRole("textbox", { name: "Password" }).fill(password);
		await this.page
			.getByRole("button", { name: "Sign up", exact: true })
			.click();
	}
}
