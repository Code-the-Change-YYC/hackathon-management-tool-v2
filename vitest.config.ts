import "dotenv/config";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
			"auth.test": fileURLToPath(new URL("./auth.test.ts", import.meta.url))
		}
	},
	test: {
		env: {
			NODE_ENV: "test",
			TZ: "UTC"
		},
		projects: [
			{
				extends: true,
				test: {
					include: ["tests/vitest/integration/**/*.test.ts"],
					name: "integration"
				}
			},
			{
				extends: true,
				test: {
					environment: "jsdom",
					include: ["tests/vitest/ui/**/*.test.tsx"],
					name: "ui",
					setupFiles: ["./tests/vitest/setup-ui.ts"]
				}
			}
		]
	}
});
