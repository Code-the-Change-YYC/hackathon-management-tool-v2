import crypto from "node:crypto";
import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
} from "@/server/api/trpc";
import { member, organization } from "@/server/db/auth-schema";

/**
 * Validates that a team name contains only alphanumeric characters, spaces, hyphens, and underscores.
 * Rejects emojis and other special characters.
 */
const teamNameSchema = z
	.string()
	.min(1, "Team name is required")
	.max(50, "Team name must be 50 characters or less")
	.regex(
		/^[a-zA-Z0-9\s\-_]+$/,
		"Team name can only contain letters, numbers, spaces, hyphens, and underscores"
	);

/**
 * Generates a unique 8-character team code
 */
function generateTeamCode(): string {
	return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export const teamRouter = createTRPCRouter({
	// Create a new team with the current user as leader
	create: protectedProcedure
		.input(
			z.object({
				name: teamNameSchema,
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const teamId = crypto.randomUUID();
			const teamCode = generateTeamCode();
			const slug = input.name
				.toLowerCase()
				.replace(/\s+/g, "-")
				.replace(/[^a-z0-9\-]/g, "");

			// Create the team (organization)
			const [team] = await ctx.db
				.insert(organization)
				.values({
					id: teamId,
					name: input.name,
					slug: `${slug}-${crypto.randomBytes(2).toString("hex")}`,
					createdAt: new Date(),
					teamCode,
				})
				.returning();

			// Add the creator as the team leader
			await ctx.db.insert(member).values({
				id: crypto.randomUUID(),
				organizationId: teamId,
				userId,
				role: "owner",
				createdAt: new Date(),
			});

			return team;
		}),
});
