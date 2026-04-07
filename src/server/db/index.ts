import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";
import * as authSchema from "./auth-schema";
import * as mealSchema from "./meal-schema";
import * as schema from "./schema";
import * as scoresSchema from "./scores-schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
	conn: postgres.Sql | undefined;
};

const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, {
	schema: { ...schema, ...authSchema, ...scoresSchema, ...mealSchema }
});
