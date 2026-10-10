import { z } from "zod";
import { TEAM_NAME_MAX, TEAM_NAME_PATTERN } from "@/lib/utils";

export const TEAM_CODE_LENGTH = 6;

export const teamNameSchema = z
	.string()
	.trim()
	.min(1, "Enter your team’s name")
	.max(TEAM_NAME_MAX, `Use ${TEAM_NAME_MAX} characters or fewer`)
	.regex(
		TEAM_NAME_PATTERN,
		"Use only letters, numbers, spaces, hyphens, and underscores"
	);

export const teamCodeSchema = z
	.string()
	.trim()
	.toUpperCase()
	.regex(
		new RegExp(`^[A-Z0-9]{${TEAM_CODE_LENGTH}}$`),
		`Enter your team’s ${TEAM_CODE_LENGTH}-character invite code`
	);

export const registerTeamSchema = z.object({ name: teamNameSchema });
export const joinTeamSchema = z.object({ teamCode: teamCodeSchema });

export type RegisterTeamValues = z.infer<typeof registerTeamSchema>;
export type JoinTeamValues = z.infer<typeof joinTeamSchema>;
