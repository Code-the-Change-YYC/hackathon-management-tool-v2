import { env } from "@/env";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const BLOCKED_DATABASE_NAMES = /(?:prod|production|staging|live)/i;

export const e2eDatabaseURL = env.DATABASE_URL;

const parsedDatabaseURL = new URL(e2eDatabaseURL);
const databaseName = decodeURIComponent(parsedDatabaseURL.pathname.slice(1));

export function assertE2EDatabaseSafety() {
	if (env.NODE_ENV === "production") {
		throw new Error("E2E database access is disabled in production");
	}

	if (
		!["postgres:", "postgresql:"].includes(parsedDatabaseURL.protocol) ||
		!LOCAL_HOSTS.has(parsedDatabaseURL.hostname)
	) {
		throw new Error(
			`E2E_DATABASE_URL must use a local PostgreSQL host, got ${parsedDatabaseURL.origin}`
		);
	}

	if (
		!databaseName ||
		(databaseName !== "postgres" && !/(?:e2e|test)/i.test(databaseName)) ||
		BLOCKED_DATABASE_NAMES.test(databaseName)
	) {
		throw new Error(
			`E2E_DATABASE_URL must target a local test database, got ${databaseName || "<missing>"}`
		);
	}
}

export function assertLocalE2EOrigin(origin: string) {
	const parsedOrigin = new URL(origin);

	if (
		parsedOrigin.protocol !== "http:" ||
		!LOCAL_HOSTS.has(parsedOrigin.hostname)
	) {
		throw new Error(
			`E2E fixtures only run against a local HTTP origin, got ${parsedOrigin.origin}`
		);
	}
}

assertE2EDatabaseSafety();
