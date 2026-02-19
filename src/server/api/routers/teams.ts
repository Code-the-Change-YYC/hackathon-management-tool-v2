import crypto from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { MEMBER_ROLES, member, organization } from "@/server/db/auth-schema";

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
 * Generates a unique 4-character alphanumeric team code.
 */
function generateTeamCode(): string {
	return crypto.randomBytes(2).toString("hex").toUpperCase();
}

export const teamsRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const teams = await ctx.db.query.organization.findMany({
			orderBy: [desc(organization.createdAt)]
		});
		return teams;
	}),

	/**
	 * Create a new team with the current user as leader.
	 * Generates a unique 4-char team code and validates the team name.
	 */
	create: protectedProcedure
		.input(
			z.object({
				name: teamNameSchema
			})
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const teamId = crypto.randomUUID();
			const teamCode = generateTeamCode();
			const slug = input.name
				.toLowerCase()
				.replace(/\s+/g, "-")
				.replace(/[^a-z0-9-]/g, "");

			// Use a transaction so both inserts succeed or fail atomically
			const team = await ctx.db.transaction(async (tx) => {
				// Create the team (organization)
				const [newTeam] = await tx
					.insert(organization)
					.values({
						id: teamId,
						name: input.name,
						slug: `${slug}-${crypto.randomBytes(2).toString("hex")}`,
						createdAt: new Date(),
						teamCode
					})
					.returning();

				// Add the creator as the team leader (owner)
				await tx.insert(member).values({
					id: crypto.randomUUID(),
					organizationId: teamId,
					userId,
					role: MEMBER_ROLES[0], // "owner"
					createdAt: new Date()
				});

				return newTeam;
			});

			return team;
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				slug: z.string().optional(),
				logo: z.string().optional().nullable(),
				metadata: z.string().optional().nullable()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [updated] = await ctx.db
				.update(organization)
				.set(data)
				.where(eq(organization.id, id))
				.returning();
			return updated;
		})
});
