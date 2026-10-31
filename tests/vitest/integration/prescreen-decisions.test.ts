import { eq } from "drizzle-orm";
import { expect, it, onTestFinished } from "vitest";
import { db } from "@/server/db";
import { organization } from "@/server/db/auth-schema";
import { Role } from "@/types/types";
import { TeamFixtureTracker } from "../../utils/teams";
import { createAuthenticatedCaller } from "../helpers/auth";

it("HMTV2-57: approval requires a submission and a decision cannot be overwritten", async () => {
	const teams = new TeamFixtureTracker();
	const admin = await createAuthenticatedCaller({ role: Role.ADMIN });
	onTestFinished(async () => {
		await teams.cleanup();
		await admin.cleanup();
	});
	const team = await teams.create("Prescreen approval");
	await expect(
		admin.caller.teams.setPrescreen({
			teamId: team.id,
			status: "passed",
			comments: "Reviewed"
		})
	).rejects.toMatchObject({
		code: "BAD_REQUEST",
		message: expect.stringContaining("Devpost")
	});
	expect(
		await db.query.organization.findFirst({
			where: eq(organization.id, team.id)
		})
	).toMatchObject({ prescreenStatus: "pending", prescreenedAt: null });
	await db
		.update(organization)
		.set({
			metadata: JSON.stringify({
				devpostLink: "https://devpost.com/software/test-project"
			})
		})
		.where(eq(organization.id, team.id));
	const approved = await admin.caller.teams.setPrescreen({
		teamId: team.id,
		status: "passed",
		comments: "Accepted submission"
	});
	expect(approved).toMatchObject({
		prescreenStatus: "passed",
		prescreenComments: "Accepted submission",
		prescreenedBy: admin.user.id
	});
	expect(approved?.prescreenedAt).toBeInstanceOf(Date);
	await expect(
		admin.caller.teams.setPrescreen({
			teamId: team.id,
			status: "failed",
			comments: "Overwrite"
		})
	).rejects.toMatchObject({ code: "CONFLICT" });
	expect(
		await db.query.organization.findFirst({
			where: eq(organization.id, team.id)
		})
	).toMatchObject({
		prescreenStatus: "passed",
		prescreenComments: "Accepted submission"
	});
});

it("HMTV2-57: rejection can record a reason without a Devpost link", async () => {
	const teams = new TeamFixtureTracker();
	const admin = await createAuthenticatedCaller({ role: Role.ADMIN });
	onTestFinished(async () => {
		await teams.cleanup();
		await admin.cleanup();
	});
	const team = await teams.create("Prescreen rejection");
	expect(
		await admin.caller.teams.setPrescreen({
			teamId: team.id,
			status: "failed",
			comments: "Submission missing"
		})
	).toMatchObject({
		prescreenStatus: "failed",
		prescreenComments: "Submission missing"
	});
});
