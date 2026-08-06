import type { Config } from "drizzle-kit";

import { env } from "@/env";
import { resolveDatabaseUrl } from "@/server/db/database-url";

export default {
	schema: ["./src/server/db/*schema.ts"],
	schemaFilter: ["public"],
	dialect: "postgresql",
	dbCredentials: {
		url: resolveDatabaseUrl(env.DATABASE_URL, env.POSTGRES_PORT)
	},
	tablesFilter: ["hackathon_*"]
} satisfies Config;
