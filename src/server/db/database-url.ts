export function resolveDatabaseUrl(databaseUrl: string, postgresPort: number) {
	const url = new URL(databaseUrl);

	if (!url.port) {
		url.port = postgresPort.toString();
	}

	return url.toString();
}
