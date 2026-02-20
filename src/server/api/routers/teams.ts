import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { organization } from "@/server/db/auth-schema";

export const teamsRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const teams = await ctx.db.query.organization.findMany({
			orderBy: [desc(organization.createdAt)]
		});
		return teams;
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
		}),
	// New feature: Querying descending for score
	getRankings: protectedProcedure.query(async ({ ctx }) => {
		const result = await ctx.db.execute(
			// I am hardcoding the SQL here because Drizzle doesn't support the necessary joins and aggregations for this query yet (GPT said so). Also, I have not defined any type for the return value yet, this is temporary.
			sql<{ id: string; name: string; totalScore: number }>`
          SELECT 
            o.id,
            o.name,
            COALESCE(SUM(s.value), 0) AS "totalScore"
          FROM hackathon_organization o
          LEFT JOIN hackathon_judging_assignment a 
            ON a.team_id = o.id
          LEFT JOIN hackathon_score s 
            ON s.assignment_id = a.id
          GROUP BY o.id, o.name
          ORDER BY "totalScore" DESC
        `
		);

		return result;
	})
});
