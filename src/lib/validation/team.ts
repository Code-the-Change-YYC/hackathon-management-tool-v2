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
	)
	// "é" can be typed as one character or as "e" plus an accent; store one form.
	.transform((name) => name.normalize("NFC"));

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

export const prescreenFeedbackSchema = z
	.string()
	.trim()
	.min(1, "Tell the team why they didn’t pass");

export const prescreenFailFormSchema = z.object({
	feedback: prescreenFeedbackSchema
});

// Passing needs no feedback; failing does.
export const prescreenSchema = z.discriminatedUnion("status", [
	z.object({
		teamId: z.string(),
		status: z.literal("passed"),
		comments: z.string().trim().optional()
	}),
	z.object({
		teamId: z.string(),
		status: z.literal("failed"),
		comments: prescreenFeedbackSchema
	})
]);

export type PrescreenFailFormValues = z.infer<typeof prescreenFailFormSchema>;
