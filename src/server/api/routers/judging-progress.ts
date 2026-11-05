import { and, eq, isNotNull } from "drizzle-orm";
import type {
	JudgingProgress,
	TeamJudgingStatus
} from "@/lib/participant-judging";
import {
	areScoresReleased,
	getAssignmentScoring,
	getTeamSchedule
} from "@/server/api/participant-judging";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { hackathonSettings } from "@/server/db/admin-schema";
import { member, organization } from "@/server/db/auth-schema";
import { judgingRounds } from "@/server/db/judging-schema";

export const judgingProgressRouter = createTRPCRouter({
	// What participants need to work out the current judging stage
	get: protectedProcedure.query(async ({ ctx }): Promise<JudgingProgress> => {
		const [settings, rounds, anyTeam, pendingTeam] = await Promise.all([
			ctx.db.query.hackathonSettings.findFirst({
				where: eq(hackathonSettings.id, 1)
			}),
			ctx.db.query.judgingRounds.findMany({
				columns: {
					id: true,
					name: true,
					kind: true,
					startTime: true,
					endTime: true
				}
			}),
			ctx.db.query.organization.findFirst({ columns: { id: true } }),
			ctx.db.query.organization.findFirst({
				where: eq(organization.prescreenStatus, "pending"),
				columns: { id: true }
			})
		]);

		return {
			startDate: settings?.startDate ?? null,
			submissionDeadline: settings?.submissionDeadline ?? null,
			prescreenComplete: anyTeam !== undefined && pendingTeam === undefined,
			rounds,
			scoresReleased: areScoresReleased(settings)
		};
	}),

	// The signed-in participant's pre-screening result, schedule and scoring
	getMine: protectedProcedure.query(
		async ({ ctx }): Promise<TeamJudgingStatus> => {
			const [membership, publishedFinal] = await Promise.all([
				ctx.db.query.member.findFirst({
					where: eq(member.userId, ctx.session.user.id),
					columns: { organizationId: true }
				}),
				ctx.db.query.judgingRounds.findFirst({
					where: and(
						eq(judgingRounds.kind, "final"),
						isNotNull(judgingRounds.publishedAt)
					),
					columns: { id: true }
				})
			]);
			const finalPublished = publishedFinal !== undefined;
			if (!membership) return { team: null, rounds: [], finalPublished };

			const teamId = membership.organizationId;
			const [team, schedule, scoring] = await Promise.all([
				ctx.db.query.organization.findFirst({
					where: eq(organization.id, teamId),
					columns: {
						name: true,
						prescreenStatus: true,
						prescreenComments: true
					}
				}),
				getTeamSchedule(ctx.db, teamId),
				getAssignmentScoring(ctx.db, teamId)
			]);
			if (!team) return { team: null, rounds: [], finalPublished };

			const scoredIds = new Set(
				scoring
					.filter((assignment) => assignment.scored)
					.map((assignment) => assignment.assignmentId)
			);
			return {
				team: {
					name: team.name,
					prescreen: team.prescreenStatus,
					feedback:
						team.prescreenStatus === "failed" ? team.prescreenComments : null
				},
				rounds: schedule.map((entry) => ({
					...entry,
					scored: entry.assignments.every((assignment) =>
						scoredIds.has(assignment.id)
					)
				})),
				finalPublished
			};
		}
	)
});
