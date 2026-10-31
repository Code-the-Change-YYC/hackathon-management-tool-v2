import { eq } from "drizzle-orm";
import { expect, it, onTestFinished } from "vitest";
import { db } from "@/server/db";
import { member, organization } from "@/server/db/auth-schema";
import { hackathonSettings } from "@/server/db/schema";
import { TeamFixtureTracker } from "../../utils/teams";
import { createAuthenticatedCaller } from "../helpers/auth";

it("HMTV2-51: submission reminders follow the team's saved link and submission deadline", async () => {
	const account = await createAuthenticatedCaller();
	const teams = new TeamFixtureTracker();
	const original = await db.query.hackathonSettings.findFirst();
	onTestFinished(async () => {
		if (original)
			await db
				.update(hackathonSettings)
				.set(original)
				.where(eq(hackathonSettings.id, 1));
		else await db.delete(hackathonSettings).where(eq(hackathonSettings.id, 1));
		await teams.cleanup();
		await account.cleanup();
	});
	const team = await teams.create("Submission status");
	await db
		.insert(member)
		.values({
			id: crypto.randomUUID(),
			organizationId: team.id,
			userId: account.user.id,
			role: "owner",
			createdAt: new Date()
		});
	const metadata = JSON.stringify({
		devpostSubmissionCloseAt: new Date(Date.now() + 3_600_000).toISOString()
	});
	await db
		.insert(hackathonSettings)
		.values({ id: 1, metadata })
		.onConflictDoUpdate({ target: hackathonSettings.id, set: { metadata } });
	expect(
		await account.caller.teams.getMyDevpostSubmissionStatus()
	).toMatchObject({ teamId: team.id, devpostLink: null, showWarning: true });
	await db
		.update(organization)
		.set({
			metadata: JSON.stringify({
				devpostLink: " https://devpost.com/software/participant-project "
			})
		})
		.where(eq(organization.id, team.id));
	expect(
		await account.caller.teams.getMyDevpostSubmissionStatus()
	).toMatchObject({
		teamId: team.id,
		devpostLink: "https://devpost.com/software/participant-project",
		showWarning: false
	});
	await db
		.update(organization)
		.set({ metadata: null })
		.where(eq(organization.id, team.id));
	await db
		.update(hackathonSettings)
		.set({
			metadata: JSON.stringify({
				devpostSubmissionCloseAt: new Date(Date.now() - 1_000).toISOString()
			})
		})
		.where(eq(hackathonSettings.id, 1));
	expect(
		await account.caller.teams.getMyDevpostSubmissionStatus()
	).toMatchObject({ devpostLink: null, showWarning: false });
});
