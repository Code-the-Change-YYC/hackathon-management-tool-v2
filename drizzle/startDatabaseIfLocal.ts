import { spawnSync } from "node:child_process";
import { createConnection } from "node:net";

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
		'DATABASE_URL is invalid. Expected a PostgreSQL URL such as "postgresql://postgres:postgres@localhost:5432/postgres".'
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

const postgresPort = Number(
	parsedDatabaseUrl.port || process.env.POSTGRES_PORT || "5432"
);

if (
	!Number.isInteger(postgresPort) ||
	postgresPort < 1 ||
	postgresPort > 65535
) {
	throw new Error("POSTGRES_PORT must be an integer between 1 and 65535.");
}

function isDatabaseReachable(host: string, port: number) {
	return new Promise<boolean>((resolve) => {
		const socket = createConnection({ host, port });
		let settled = false;

		const finish = (reachable: boolean) => {
			if (settled) return;
			settled = true;
			socket.destroy();
			resolve(reachable);
		};

		socket.setTimeout(1000);
		socket.once("connect", () => finish(true));
		socket.once("error", () => finish(false));
		socket.once("timeout", () => finish(false));
	});
}

if (await isDatabaseReachable(hostname, postgresPort)) {
	console.log(
		`Local database is reachable at "${hostname}:${postgresPort}"; skipping Docker startup.`
	);
	process.exit(0);
}

console.log(
	`No database is reachable at "${hostname}:${postgresPort}"; starting PostgreSQL with Docker...`
);

const result = spawnSync("docker", ["compose", "up", "-d", "--wait"], {
	stdio: "inherit",
	env: {
		...process.env,
		POSTGRES_PORT: postgresPort.toString()
	} as NodeJS.ProcessEnv
});

if (result.error) {
	throw new Error(`Failed to start Docker Compose: ${result.error.message}`);
}

if (result.status !== 0) {
	throw new Error(
		`Docker Compose failed with exit code ${result.status ?? "unknown"}.`
	);
}
