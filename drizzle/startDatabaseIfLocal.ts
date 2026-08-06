import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error(
		"DATABASE_URL is required. Set it to a local PostgreSQL URL or a remote database URL."
	);
}

let parsedDatabaseUrl: URL;

try {
	parsedDatabaseUrl = new URL(databaseUrl);
} catch {
	throw new Error(
		"DATABASE_URL is invalid. Expected a PostgreSQL URL such as postgresql://postgres:postgres@localhost:5432/postgres."
	);
}

if (
	parsedDatabaseUrl.protocol !== "postgres:" &&
	parsedDatabaseUrl.protocol !== "postgresql:"
) {
	throw new Error(
		`DATABASE_URL is invalid. Expected a PostgreSQL URL, received protocol "${parsedDatabaseUrl.protocol}".`
	);
}

const hostname = parsedDatabaseUrl.hostname.replace(/^\[(.*)\]$/, "$1");

if (!hostname) {
	throw new Error("DATABASE_URL is invalid. Expected a URL with a hostname.");
}

const localHostnames = new Set(["localhost", "127.0.0.1", "::1"]);

if (!localHostnames.has(hostname)) {
	console.log(
		`DATABASE_URL uses remote host "${hostname}"; skipping Docker startup.`
	);
	process.exit(0);
}

console.log(
	`DATABASE_URL uses local host "${hostname}"; starting PostgreSQL...`
);

const result = spawnSync("docker", ["compose", "up", "-d", "--wait"], {
	stdio: "inherit"
});

if (result.error) {
	throw new Error(`Failed to start Docker Compose: ${result.error.message}`);
}

if (result.status !== 0) {
	throw new Error(
		`Docker Compose failed with exit code ${result.status ?? "unknown"}.`
	);
}
