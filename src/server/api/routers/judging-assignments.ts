import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { judgingAssignments } from "@/server/db/schema";

export const judgingAssignmentsRouter = createTRPCRouter({
  // Get all assignments
  getAll: publicProcedure.query(async ({ ctx }) => {
    const assignments = await ctx.db.query.judgingAssignments.findMany({
      with: {
        judge: true,
        team: true,
        round: true,
        scores: true,
      },
      orderBy: (assignments, { desc }) => [desc(assignments.createdAt)],
    });
    return assignments;
  }),

  // Get assignments by round ID
  getByRound: publicProcedure
    .input(z.object({ roundId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const assignments = await ctx.db.query.judgingAssignments.findMany({
        where: eq(judgingAssignments.roundId, input.roundId),
        with: {
          judge: true,
          team: true,
          scores: true,
        },
      });
      return assignments;
    }),

  // Get assignments for a specific judge
  getByJudge: protectedProcedure
    .input(z.object({ judgeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const assignments = await ctx.db.query.judgingAssignments.findMany({
        where: eq(judgingAssignments.judgeId, input.judgeId),
        with: {
          team: true,
          round: true,
          scores: true,
        },
        orderBy: (assignments, { asc }) => [asc(assignments.timeSlot)],
      });
      return assignments;
    }),

  // Get assignments for a specific team
  getByTeam: publicProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ ctx, input }) => {
      const assignments = await ctx.db.query.judgingAssignments.findMany({
        where: eq(judgingAssignments.teamId, input.teamId),
        with: {
          judge: true,
          round: true,
          scores: true,
        },
      });
      return assignments;
    }),

  // Create a new assignment
  create: protectedProcedure
    .input(
      z.object({
        judgeId: z.string(),
        teamId: z.string(),
        roundId: z.string().uuid(),
        timeSlot: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [assignment] = await ctx.db
        .insert(judgingAssignments)
        .values(input)
        .returning();
      return assignment;
    }),

  // Update an assignment
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        judgeId: z.string().optional(),
        teamId: z.string().optional(),
        roundId: z.string().uuid().optional(),
        timeSlot: z.date().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(judgingAssignments)
        .set(data)
        .where(eq(judgingAssignments.id, id))
        .returning();
      return updated;
    }),

  // Delete an assignment
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(judgingAssignments)
        .where(eq(judgingAssignments.id, input.id));
      return { success: true };
    }),
});
