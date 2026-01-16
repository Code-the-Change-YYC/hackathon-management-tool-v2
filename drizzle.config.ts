import type { Config } from "drizzle-kit";

import { env } from "@/env";

export default {
	schema: [
		"./src/server/db/schema.ts", // data schema
		"./src/server/db/auth-schema.ts", // auth schema
	],
	dialect: "postgresql",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
	tablesFilter: ["hackathon-management-tool-v2_*"],
} satisfies Config;
