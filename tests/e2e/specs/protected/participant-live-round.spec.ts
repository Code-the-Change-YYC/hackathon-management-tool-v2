import { eq, inArray } from "drizzle-orm";
import type { Page } from "playwright/test";
import { db } from "@/server/db";
import { member } from "@/server/db/auth-schema";
import {
	hackathonSettings,
	judgingAssignments,
	judgingRooms,
	judgingRounds
} from "@/server/db/schema";
import { Role } from "@/types/types";
import { TeamFixtureTracker } from "../../../utils/teams";
import { expect, test } from "../../fixtures/settings.fixture";

test.use({
	authUserOptions: { role: Role.PARTICIPANT, completedRegistration: true }
});

test("PART02: an active-round change refreshes both views without leaking another team's assignment", async ({
	authenticatedPage: page,
	context,
	authUser,
	setSettings
}) => {
	test.setTimeout(60_000);
	const teams = new TeamFixtureTracker();
	const roundIds = [crypto.randomUUID(), crypto.randomUUID()];
	let dashboard: Page | undefined;
	try {
		const teamA = await teams.create("Team A");
		const teamB = await teams.create("Private Team B");
		await db.insert(member).values({
			id: crypto.randomUUID(),
			organizationId: teamA.id,
			userId: authUser.id,
			role: "owner",
			createdAt: new Date()
		});
		const names = ["Live Round One", "Live Round Two"];
		for (const [index, id] of roundIds.entries()) {
			await db.insert(judgingRounds).values({
				id,
				name: names[index] ?? "Round",
				startTime: new Date(`2099-06-15T${18 + index * 2}:00:00Z`),
				endTime: new Date(`2099-06-15T${19 + index * 2}:00:00Z`)
			});
			for (const [label, team] of [
				["a", teamA],
				["b", teamB]
			] as const) {
				const [room] = await db
					.insert(judgingRooms)
					.values({
						roundId: id,
						roomLink: `https://example.com/${label}/${index}`
					})
					.returning();
				if (!room) throw new Error("Missing room fixture");
				await db.insert(judgingAssignments).values({
					roomId: room.id,
					teamId: team.id,
					timeSlot: new Date(`2099-06-15T${18 + index * 2}:30:00Z`)
				});
			}
		}
		await setSettings({ currentRoundId: roundIds[0], judgingPhase: "judging" });
		await page.goto("/participant/judging");
		dashboard = await context.newPage();
		await dashboard.goto("/participant");
		await expect(
			page.getByRole("heading", {
				name: `${names[0]}: your team’s judging assignment`
			})
		).toBeVisible();
		await expect(
			dashboard.getByText(`Judging: ${names[0]}`, { exact: true })
		).toBeVisible();
		for (const tab of [page, dashboard])
			await tab.evaluate(() => {
				document.documentElement.dataset.liveRoundMarker = "same-document";
			});
		await setSettings({ currentRoundId: roundIds[1] });
		const dashboardPage = dashboard;
		await expect
			.poll(
				async () =>
					(await page.locator("body").innerText()).includes(
						`${names[1]}: your team’s judging assignment`
					) &&
					(await dashboardPage.locator("body").innerText()).includes(
						`Judging: ${names[1]}`
					),
				{ timeout: 45_000 }
			)
			.toBe(true);
		await expect(
			page.getByRole("link", { name: "Join meeting", exact: true })
		).toHaveAttribute("href", "https://example.com/a/1");
		await expect(
			page.getByText("2:30 PM", { exact: true }).first()
		).toBeVisible();
		for (const tab of [page, dashboard]) {
			await expect(tab.getByText(teamB.name, { exact: true })).toHaveCount(0);
			expect(
				await tab.evaluate(
					() => document.documentElement.dataset.liveRoundMarker
				)
			).toBe("same-document");
		}
		const response = await page.request.get(
			"/api/trpc/judgingAssignments.getMineForActiveRound"
		);
		expect(response.ok()).toBe(true);
		const body = await response.text();
		expect(body).toContain(teamA.id);
		expect(body).not.toContain(teamB.id);
		expect(body).not.toContain(teamB.name);
	} finally {
		await dashboard?.close();
		await db
			.update(hackathonSettings)
			.set({ currentRoundId: null })
			.where(eq(hackathonSettings.id, 1));
		await db.delete(judgingRounds).where(inArray(judgingRounds.id, roundIds));
		await teams.cleanup();
	}
});
