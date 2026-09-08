// Client-side team-name rule, mirroring teamNameSchema in
// src/server/api/routers/teams.ts. Server validation stays authoritative.

export const TEAM_NAME_PATTERN = /^[a-zA-Z0-9 _-]+$/;
export const TEAM_NAME_MAX = 50;

export function isValidTeamName(name: string): boolean {
	const trimmed = name.trim();
	return (
		trimmed.length > 0 &&
		trimmed.length <= TEAM_NAME_MAX &&
		TEAM_NAME_PATTERN.test(trimmed)
	);
}
