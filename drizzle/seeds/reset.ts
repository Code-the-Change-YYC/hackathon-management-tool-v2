import { is, sql } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { env } from "@/env";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

// Seeding starts from an empty database, so it refuses to touch a remote one.
export async function resetDatabase() {
	const { hostname } = new URL(env.DATABASE_URL);
	if (!LOCAL_HOSTS.has(hostname)) {
		throw new Error(
			`Seeding deletes all data, so it only runs against a local database, not ${hostname}.`
		);
	}

	console.log("Clearing the database...");
	const tables = Object.values(schema).filter((value) => is(value, PgTable));
	await db.execute(sql`TRUNCATE TABLE ${sql.join(tables, sql`, `)} CASCADE`);
}
