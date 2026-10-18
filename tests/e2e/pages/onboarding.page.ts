import type { Page } from "playwright/test";

/** Helpers for the onboarding steps' dropdowns and searchable pickers. */
export class OnboardingPage {
	constructor(private readonly page: Page) {}

	async selectOption(label: string, option: string) {
		await this.page.getByLabel(label, { exact: true }).click();
		await this.page.getByRole("option", { name: option, exact: true }).click();
	}

	async searchAndChoose(label: string, search: string, option: string) {
		const input = this.page.getByLabel(label, { exact: true });
		await input.click();
		await input.pressSequentially(search);
		await this.page.getByRole("option", { name: option, exact: true }).click();
	}

	async continue() {
		await this.page
			.getByRole("button", { name: "Continue", exact: true })
			.click();
	}
}
