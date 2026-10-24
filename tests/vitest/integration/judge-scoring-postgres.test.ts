import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/better-auth", () => ({ auth: { api: {} } }));

import { judgingAssignmentsRouter } from "@/server/api/routers/judging-assignments";
import { scoresRouter } from "@/server/api/routers/scores";
import { teamsRouter } from "@/server/api/routers/teams";
import * as authSchema from "@/server/db/auth-schema";
import * as schema from "@/server/db/schema";
import * as scoreSchema from "@/server/db/scores-schema";

// Opt in against local PostgreSQL only. Every fixture lives in a temporary table;
// no real scores, accounts, schema, or settings are changed by this test.
describe.skipIf(process.env.RUN_JUDGING_DB_TESTS !== "1")(
	"individual scoring on PostgreSQL",
	() => {
		it("migrates legacy records, isolates judges, upserts independently, and averages complete scorecards", async () => {
			const url = process.env.DATABASE_URL;
			if (
				!url ||
				!["localhost", "127.0.0.1", "::1"].includes(new URL(url).hostname)
			)
				throw new Error("This test requires a local DATABASE_URL.");
			const connection = postgres(url, { max: 1, connect_timeout: 5 });
			try {
				const database = drizzle(connection, {
					schema: { ...authSchema, ...schema, ...scoreSchema }
				});
				await database.transaction(async (db) => {
					const tables = [
						"user",
						"organization",
						"member",
						"judging_round",
						"judging_room",
						"judging_room_staff",
						"judging_assignment",
						"criteria",
						"hackathon_settings"
					];
					for (const table of tables) {
						await db.execute(
							sql.raw(
								`CREATE TEMP TABLE hackathon_${table} (LIKE public.hackathon_${table} INCLUDING ALL) ON COMMIT DROP`
							)
						);
					}
					await db.execute(
						sql.raw(`CREATE TEMP TABLE hackathon_score (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id uuid NOT NULL,
     criteria_id uuid NOT NULL, value integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
    ) ON COMMIT DROP`)
					);
					await db.execute(
						sql.raw(
							"CREATE UNIQUE INDEX one_score_per_criteria_per_assignment ON hackathon_score (assignment_id, criteria_id)"
						)
					);
					const [
						assignmentA,
						assignmentB,
						roundId,
						roomA,
						roomB,
						mainA,
						mainB,
						side
					] = Array.from({ length: 8 }, () => randomUUID()) as [
						string,
						string,
						string,
						string,
						string,
						string,
						string,
						string
					];
					await db.insert(authSchema.user).values(
						["judge-a", "judge-b", "judge-c", "participant"].map((id) => ({
							id,
							name: id,
							email: `${id}@test.invalid`,
							role: id === "participant" ? "participant" : "judge"
						}))
					);
					await db.insert(authSchema.organization).values(
						["team-a", "team-b"].map((id) => ({
							id,
							name: id,
							slug: id,
							createdAt: new Date()
						}))
					);
					await db.insert(authSchema.member).values({
						id: "member",
						organizationId: "team-a",
						userId: "participant",
						createdAt: new Date()
					});
					await db.insert(schema.judgingRounds).values({
						id: roundId,
						name: "Round",
						startTime: new Date(0),
						endTime: new Date()
					});
					await db.insert(schema.judgingRooms).values([
						{ id: roomA, roundId, roomLink: "" },
						{ id: roomB, roundId, roomLink: "" }
					]);
					await db.insert(schema.judgingRoomStaff).values([
						{ roomId: roomA, staffId: "judge-a" },
						{ roomId: roomA, staffId: "judge-b" },
						{ roomId: roomA, staffId: "judge-c" },
						{ roomId: roomB, staffId: "judge-a" }
					]);
					await db.insert(schema.judgingAssignments).values([
						{ id: assignmentA, teamId: "team-a", roomId: roomA },
						{ id: assignmentB, teamId: "team-b", roomId: roomB }
					]);
					await db.insert(scoreSchema.criteria).values([
						{ id: mainA, name: "Technical", maxScore: 10 },
						{ id: mainB, name: "Innovation", maxScore: 10 },
						{ id: side, name: "Best AI", maxScore: 5, isSidepot: true }
					]);
					await db.execute(
						sql`INSERT INTO hackathon_score (assignment_id, criteria_id, value) VALUES (${assignmentA}, ${mainA}, 10)`
					);
					const migration = await readFile(
						new URL(
							"../../../drizzle/0002_individual_judge_scores.sql",
							import.meta.url
						),
						"utf8"
					);
					// Adapt only the FK schema to the temporary fixture's user table.
					for (const statement of migration
						.replace('"public"."hackathon_user"', '"pg_temp"."hackathon_user"')
						.split("--> statement-breakpoint"))
						await db.execute(sql.raw(statement));
					expect(await db.query.scores.findMany()).toMatchObject([
						{ judgeId: null, value: 10 }
					]);
					function context(id: string, role = "judge") {
						return {
							db,
							session: { user: { id, role } },
							headers: new Headers()
						} as never;
					}
					const judgeA = scoresRouter.createCaller(context("judge-a"));
					const judgeB = scoresRouter.createCaller(context("judge-b"));
					const admin = teamsRouter.createCaller(context("admin", "admin"));
					const card = (
						assignmentId: string,
						first: number,
						second: number,
						sidepot: number
					) => [
						{ assignmentId, criteriaId: mainA, score: first },
						{ assignmentId, criteriaId: mainB, score: second },
						{ assignmentId, criteriaId: side, score: sidepot }
					];
					await judgeA.createMany(card(assignmentA, 4, 6, 0));
					await judgeB.createMany(card(assignmentA, 9, 9, 5));
					await judgeA.createMany(card(assignmentB, 7, 7, 0));
					// An incomplete import must not dilute the average or count as a submission.
					await db.insert(scoreSchema.scores).values({
						judgeId: "judge-c",
						assignmentId: assignmentA,
						criteriaId: mainA,
						value: 1
					});
					const ownA = await judgeA.getByAssignment({
						assignmentId: assignmentA
					});
					const ownB = await judgeB.getByAssignment({
						assignmentId: assignmentA
					});
					expect(ownA.map((row) => row.value).sort()).toEqual([0, 4, 6]);
					expect(ownB.map((row) => row.value).sort()).toEqual([5, 9, 9]);
					expect(ownA.every((row) => row.judgeId === "judge-a")).toBe(true);
					const assignments = await judgingAssignmentsRouter
						.createCaller(context("judge-a"))
						.getByJudge({ judgeId: "judge-a" });
					expect(
						assignments
							.flatMap((row) => row.scores)
							.every((row) => row.judgeId === "judge-a")
					).toBe(true);
					const rankings = await admin.getRankings();
					expect(rankings.find((row) => row.id === "team-a")).toMatchObject({
						totalScore: 14,
						submittedScorecards: 2,
						expectedScorecards: 3,
						legacyScores: 1
					});
					expect(rankings.find((row) => row.id === "team-b")).toMatchObject({
						totalScore: 14,
						submittedScorecards: 1,
						expectedScorecards: 1
					});
					await judgeA.createMany(card(assignmentA, 8, 8, 0));
					await judgeA.createMany(card(assignmentA, 8, 8, 0));
					expect(
						(await judgeB.getByAssignment({ assignmentId: assignmentA }))
							.map((row) => row.value)
							.sort()
					).toEqual([5, 9, 9]);
					expect(
						await judgeA.getByAssignment({ assignmentId: assignmentA })
					).toHaveLength(3);
					expect(
						(await admin.getRankings()).find((row) => row.id === "team-a")
							?.totalScore
					).toBe(17);
					const participant = scoresRouter.createCaller(
						context("participant", "participant")
					);
					await db.insert(schema.hackathonSettings).values({
						id: 1,
						startDate: new Date(),
						endDate: new Date(),
						judgingPhase: "judging"
					});
					expect(await participant.getMineReleased()).toEqual({
						released: false,
						rounds: []
					});
					await db.execute(
						sql`UPDATE hackathon_hackathon_settings SET judging_phase = 'winners_announced'`
					);
					const released = await participant.getMineReleased();
					expect(released.released).toBe(true);
					expect(
						released.rounds.find((row) => row.criterionId === mainA)?.value
					).toBe(8.5);
					expect(
						released.rounds.find((row) => row.criterionId === mainB)?.value
					).toBe(8.5);
					expect(
						released.rounds.find((row) => row.criterionId === side)?.value
					).toBe(2.5);
				});
			} finally {
				await connection.end();
			}
		}, 30000);
	}
);
