/**
 * Teams router — manages hackathon teams, which are represented as `organization` rows in the
 * better-auth schema.
 *
 * Key design notes:
 * - Team names are strictly validated (letters, numbers, spaces, hyphens, underscores only) to
 *   prevent issues with emojis or special characters that caused problems in prior years.
 * - Each team is assigned a unique 4-character uppercase hex code (e.g. "A3F2") on creation.
 * - The `create` mutation is wrapped in a transaction so the organization row and the initial
 *   owner membership are always created together or not at all.
 * - Member roles are sourced from the `MEMBER_ROLES` constant in auth-schema rather than
 *   hardcoded strings to keep role definitions in a single place.
 */

import crypto from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { member, organization } from "@/server/db/auth-schema";
import { MEMBER_ROLES } from "@/types/types";

const teamNameSchema = z
	.string()
	.min(1, "Team name is required")
	.max(50, "Team name must be 50 characters or less")
	.regex(
		/^[a-zA-Z0-9\s\-_]+$/,
		"Team name can only contain letters, numbers, spaces, hyphens, and underscores"
	);

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

			const team = await ctx.db.transaction(async (tx) => {
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

				await tx.insert(member).values({
					id: crypto.randomUUID(),
					organizationId: teamId,
					userId,
					role: MEMBER_ROLES.OWNER,
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
