import { defineConfig, devices } from "playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
	forbidOnly: Boolean(process.env.CI),
	outputDir: "test-results",
	reporter: [
		["html", { open: "never", outputFolder: "playwright-report" }],
		["list"]
	],
	testDir: "./tests/e2e/specs",
	timeout: 30_000,
	use: {
		baseURL,
		screenshot: "only-on-failure",
		trace: "retain-on-failure",
		video: "retain-on-failure"
	},
	webServer: {
		command: "pnpm dev --port 3000",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		url: baseURL
	},
	workers: 1,
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"]
			}
		}
	]
});
