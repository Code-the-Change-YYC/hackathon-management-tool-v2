import "dotenv/config";
import { defineConfig, devices } from "playwright/test";
import { env } from "@/env";
import { assertE2EDatabaseSafety } from "./tests/e2e/db";

assertE2EDatabaseSafety();

const baseURL = "http://127.0.0.1:3000";

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
		command: process.env.CI
			? "pnpm exec next dev --port 3000"
			: "pnpm dev --port 3000",
		env: {
			DATABASE_URL: env.DATABASE_URL,
			// Tests sign up throwaway addresses, so print emails to the console
			// rather than sending them, even when .env has a Resend key.
			RESEND_API_KEY: ""
		},
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
