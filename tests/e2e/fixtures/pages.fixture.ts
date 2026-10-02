import { LoginPage } from "../pages/login.page";
import { OnboardingPage } from "../pages/onboarding.page";
import { SignupPage } from "../pages/signup.page";
import { test as base, expect } from "./auth.fixture";

type PageFixtures = {
	loginPage: LoginPage;
	onboardingPage: OnboardingPage;
	signupPage: SignupPage;
};

export const test = base.extend<PageFixtures>({
	loginPage: async ({ page }, use) => {
		await use(new LoginPage(page));
	},

	onboardingPage: async ({ page }, use) => {
		await use(new OnboardingPage(page));
	},

	signupPage: async ({ page }, use) => {
		await use(new SignupPage(page));
	}
});

export { expect };
