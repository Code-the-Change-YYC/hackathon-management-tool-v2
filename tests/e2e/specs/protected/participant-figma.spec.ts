import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { member, organization } from "@/server/db/auth-schema";
import { event } from "@/server/db/event-schema";
import { EventStatus, Role } from "@/types/types";
import { createTestUser } from "../../../utils/auth";
import { EventFixtureTracker } from "../../../utils/events";
import { TeamFixtureTracker } from "../../../utils/teams";
import { expect, test } from "../../fixtures/auth.fixture";

type Size = { width: number; height: number };

const screens: {
	name: string;
	path: string;
	sizes: Record<string, Size & { maxDiff: number }>;
}[] = [
	{
		name: "profile",
		path: "/participant/profile",
		sizes: {
			desktop: { width: 1280, height: 832, maxDiff: 0.04 },
			tablet: { width: 834, height: 896, maxDiff: 0.04 },
			mobile: { width: 393, height: 896, maxDiff: 0.05 }
		}
	},
	{
		name: "team",
		path: "/participant/team",
		sizes: {
			desktop: { width: 1256, height: 832, maxDiff: 0.04 },
			tablet: { width: 834, height: 1194, maxDiff: 0.04 },
			mobile: { width: 393, height: 852, maxDiff: 0.06 }
		}
	},
	{
		name: "meals",
		path: "/participant/meals",
		sizes: {
			desktop: { width: 1280, height: 1345, maxDiff: 0.08 },
			tablet: { width: 834, height: 1553, maxDiff: 0.1 },
			mobile: { width: 393, height: 2354, maxDiff: 0.13 }
		}
	}
];

test.use({
	authUserOptions: {
		dietaryRestrictions: ["vegetarian", "halal"],
		name: "Victoria Wong",
		program: "computer_science",
		role: Role.PARTICIPANT,
		school: "University of Calgary"
	}
});

const minutesFromNow = (minutes: number) =>
	new Date(Date.now() + minutes * 60_000);

const cleanups: (() => Promise<void>)[] = [];

test.beforeEach(async ({ authUser }) => {
	const teams = new TeamFixtureTracker();
	const events = new EventFixtureTracker();
	const team = await teams.create("Code Wizards");
	const teammates = await Promise.all(
		["Fiona Truong", "Grace Ilori"].map((name) => createTestUser({ name }))
	);
	await db.insert(member).values(
		[authUser.id, ...teammates.map(({ user }) => user.id)].map((userId, i) => ({
			id: crypto.randomUUID(),
			organizationId: team.id,
			userId,
			role: i === 0 ? ("owner" as const) : ("member" as const),
			createdAt: new Date()
		}))
	);
	for (const [title, start] of [
		["Lunch", -30],
		["Dinner", 300],
		["Breakfast", 1200]
	] as const) {
		const created = await events.create({
			endTime: minutesFromNow(start + 60),
			startTime: minutesFromNow(start),
			status: EventStatus.ACTIVE,
			title
		});
		await db.update(event).set({ title }).where(eq(event.id, created.id));
	}
	await db
		.update(organization)
		.set({ name: "Code Wizards" })
		.where(eq(organization.id, team.id));

	cleanups.push(async () => {
		await events.cleanup();
		await teams.cleanup();
		for (const { cleanup } of teammates) await cleanup();
	});
});

test.afterEach(async () => {
	for (const cleanup of cleanups.splice(0)) await cleanup();
});

for (const { name, path, sizes } of screens) {
	for (const [size, { width, height, maxDiff }] of Object.entries(sizes)) {
		test(`${name} ${size} matches Figma`, async ({
			authenticatedPage: page
		}) => {
			await page.setViewportSize({ width, height });
			await page.goto(path);
			await page.waitForLoadState("networkidle");
			await page.evaluate(() => document.fonts.ready);

			const screenshot = await page.screenshot({
				animations: "disabled",
				caret: "hide",
				style: "nextjs-portal { display: none; }"
			});
			expect(screenshot).toMatchSnapshot(`${name}-${size}.png`, {
				maxDiffPixelRatio: maxDiff
			});
		});
	}
}
