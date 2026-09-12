import { LoginPage } from "../pages/login.page";
import { SignupPage } from "../pages/signup.page";
import { test as base, expect } from "./auth.fixture";

type PageFixtures = {
	loginPage: LoginPage;
	signupPage: SignupPage;
};

export const test = base.extend<PageFixtures>({
	loginPage: async ({ page }, use) => {
		await use(new LoginPage(page));
	},

	signupPage: async ({ page }, use) => {
		await use(new SignupPage(page));
	}
});

export { expect };
