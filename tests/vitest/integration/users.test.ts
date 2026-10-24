import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, onTestFinished } from "vitest";
import { DIETARY_RESTRICTIONS } from "@/lib/validation/signup";
import { db } from "@/server/db";
import { organization, user } from "@/server/db/auth-schema";
import { Role } from "@/types/types";
import { assertE2EDatabaseSafety } from "../../e2e/db";
import { createTestUser } from "../../utils/auth";
import {
	createAuthenticatedCaller,
	createUnauthenticatedCaller
} from "../helpers/auth";

// Mid-registration users keep Better Auth's default role until they finish.
const newParticipant = { completedRegistration: false, name: "", role: "user" };

const personalDetails = {
	firstName: "Maria Anne",
	lastName: "De La Cruz",
	age: 17,
	phoneNumber: "+14035550123",
	countryOfResidence: "CA",
	school: "Western Canada High School",
	levelOfStudy: "secondary",
	program: null
} as const;

async function getSavedUser(id: string) {
	return db.query.user.findFirst({ where: eq(user.id, id) });
}

describe("users onboarding", () => {
	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	it("saves the details MLH asks for, keeping first and last names apart", async () => {
		const {
			caller,
			cleanup,
			user: testUser
		} = await createAuthenticatedCaller(newParticipant);
		onTestFinished(cleanup);

		await caller.users.updateProfile(personalDetails);

		expect(await getSavedUser(testUser.id)).toMatchObject({
			...personalDetails,
			name: "Maria Anne De La Cruz"
		});
	});

	it("records the MLH policies once both required boxes are ticked", async () => {
		const {
			caller,
			cleanup,
			user: testUser
		} = await createAuthenticatedCaller(newParticipant);
		onTestFinished(cleanup);

		await expect(
			caller.users.acceptMlhPolicies({
				codeOfConduct: true,
				dataSharing: false,
				emailOptIn: true
			})
		).rejects.toMatchObject({ code: "BAD_REQUEST" });

		await caller.users.acceptMlhPolicies({
			codeOfConduct: true,
			dataSharing: true,
			emailOptIn: true
		});

		expect(await getSavedUser(testUser.id)).toMatchObject({
			mlhCodeOfConductAcceptedAt: expect.any(Date),
			mlhDataSharingAcceptedAt: expect.any(Date),
			mlhEmailOptIn: true
		});
	});

	it("only completes registration after the MLH policies are accepted", async () => {
		const { caller, cleanup } = await createAuthenticatedCaller({
			...newParticipant,
			...personalDetails,
			name: "Maria Anne De La Cruz",
			wantsFood: false
		});
		onTestFinished(cleanup);

		await expect(caller.users.completeRegistration()).rejects.toMatchObject({
			code: "PRECONDITION_FAILED"
		});

		await caller.users.acceptMlhPolicies({
			codeOfConduct: true,
			dataSharing: true,
			emailOptIn: false
		});

		await expect(caller.users.completeRegistration()).resolves.toEqual({
			role: Role.PARTICIPANT
		});
	});
});

describe("users.getDietaryAnalytics", () => {
	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	it("rejects callers without a session", async () => {
		const caller = createUnauthenticatedCaller();

		await expect(caller.users.getDietaryAnalytics()).rejects.toMatchObject({
			code: "UNAUTHORIZED"
		});
	});

	it("rejects callers without the admin role", async () => {
		const { caller, cleanup } = await createAuthenticatedCaller();
		onTestFinished(cleanup);

		await expect(caller.users.getDietaryAnalytics()).rejects.toMatchObject({
			code: "FORBIDDEN"
		});
	});

	it("counts restrictions and symmetric overlaps for completed participants", async () => {
		const { caller, cleanup } = await createAuthenticatedCaller({
			role: Role.ADMIN
		});
		onTestFinished(cleanup);

		const before = await caller.users.getDietaryAnalytics();
		const includedUsers = [
			["halal", "vegetarian"],
			["vegetarian", "vegan"],
			[]
		] as const;

		for (const dietaryRestrictions of includedUsers) {
			const { cleanup: userCleanup } = await createTestUser({
				completedRegistration: true,
				dietaryRestrictions: [...dietaryRestrictions],
				role: Role.PARTICIPANT
			});
			onTestFinished(userCleanup);
		}

		const { cleanup: incompleteUserCleanup } = await createTestUser({
			completedRegistration: false,
			dietaryRestrictions: ["halal", "vegan"],
			role: Role.PARTICIPANT
		});
		onTestFinished(incompleteUserCleanup);

		const { cleanup: judgeCleanup } = await createTestUser({
			completedRegistration: true,
			dietaryRestrictions: ["halal", "vegan"],
			role: Role.JUDGE
		});
		onTestFinished(judgeCleanup);

		const after = await caller.users.getDietaryAnalytics();
		const expectedCounts = {
			...before.counts,
			halal: before.counts.halal + 1,
			vegetarian: before.counts.vegetarian + 2,
			vegan: before.counts.vegan + 1
		};
		const expectedOverlaps = Object.fromEntries(
			DIETARY_RESTRICTIONS.map((restriction) => [
				restriction,
				{ ...before.overlaps[restriction] }
			])
		) as typeof before.overlaps;

		expectedOverlaps.halal.halal += 1;
		expectedOverlaps.vegetarian.vegetarian += 2;
		expectedOverlaps.vegan.vegan += 1;
		expectedOverlaps.halal.vegetarian += 1;
		expectedOverlaps.vegetarian.halal += 1;
		expectedOverlaps.vegetarian.vegan += 1;
		expectedOverlaps.vegan.vegetarian += 1;

		expect(after.counts).toEqual(expectedCounts);
		expect(after.overlaps).toEqual(expectedOverlaps);
	});
});

describe("users.getUserWithTeam", () => {
	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	it("rejects unauthenticated and non-admin callers", async () => {
		await expect(
			createUnauthenticatedCaller().users.getUserWithTeam()
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });

		const { caller, cleanup } = await createAuthenticatedCaller();
		onTestFinished(cleanup);

		await expect(caller.users.getUserWithTeam()).rejects.toMatchObject({
			code: "FORBIDDEN"
		});
	});

	it("maps each user to their first team and preserves users without a team", async () => {
		const { caller: adminCaller, cleanup: adminCleanup } =
			await createAuthenticatedCaller({ role: Role.ADMIN });
		onTestFinished(adminCleanup);

		const {
			caller: teamOwnerCaller,
			cleanup: teamOwnerCleanup,
			user: teamOwner
		} = await createAuthenticatedCaller({
			firstName: "Ada",
			lastName: "Lovelace",
			program: "computer_science",
			role: Role.PARTICIPANT,
			school: "University of Calgary",
			wantsFood: true
		});
		onTestFinished(teamOwnerCleanup);

		const { cleanup: withoutTeamCleanup, user: withoutTeam } =
			await createAuthenticatedCaller({
				firstName: "Grace",
				lastName: "Hopper",
				role: Role.JUDGE,
				wantsFood: false
			});
		onTestFinished(withoutTeamCleanup);

		const team = await teamOwnerCaller.teams.create({
			name: `Users test team ${crypto.randomUUID().slice(0, 8)}`
		});
		if (!team) throw new Error("Team was not created");

		onTestFinished(async () => {
			await db.delete(organization).where(eq(organization.id, team.id));
		});

		const rows = await adminCaller.users.getUserWithTeam();

		expect(rows).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: teamOwner.id,
					firstName: "Ada",
					lastName: "Lovelace",
					email: teamOwner.email,
					role: Role.PARTICIPANT,
					teamId: team.id,
					teamName: team.name,
					institution: "University of Calgary",
					major: "computer_science",
					registeredForFood: true
				}),
				expect.objectContaining({
					id: withoutTeam.id,
					firstName: "Grace",
					lastName: "Hopper",
					role: Role.JUDGE,
					teamId: null,
					teamName: null,
					institution: null,
					major: null,
					registeredForFood: false
				})
			])
		);
	});
});

describe("users.update", () => {
	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	it("requires an admin caller", async () => {
		const { cleanup: targetCleanup, user: targetUser } = await createTestUser();
		onTestFinished(targetCleanup);

		await expect(
			createUnauthenticatedCaller().users.update({
				id: targetUser.id,
				role: Role.JUDGE
			})
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });

		const { caller, cleanup } = await createAuthenticatedCaller();
		onTestFinished(cleanup);

		await expect(
			caller.users.update({ id: targetUser.id, role: Role.JUDGE })
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	it("validates paired names and missing users", async () => {
		const admin = await createAuthenticatedCaller({ role: Role.ADMIN });
		onTestFinished(admin.cleanup);

		await expect(
			admin.caller.users.update({ id: "missing-user", firstName: "Only" })
		).rejects.toMatchObject({ code: "BAD_REQUEST" });

		await expect(
			admin.caller.users.update({ id: "missing-user", role: Role.JUDGE })
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});

	it("updates admin-managed fields and rebuilds the full name", async () => {
		const { caller: adminCaller, cleanup: adminCleanup } =
			await createAuthenticatedCaller({ role: Role.ADMIN });
		onTestFinished(adminCleanup);

		const { cleanup: targetCleanup, user: targetUser } = await createTestUser({
			completedRegistration: false,
			dietaryRestrictions: ["halal"],
			firstName: "Original",
			lastName: "User",
			name: "Original User",
			role: Role.PARTICIPANT
		});
		onTestFinished(targetCleanup);

		const email = `updated-${crypto.randomUUID()}@hackathon.com`;
		const updated = await adminCaller.users.update({
			banned: true,
			completedRegistration: true,
			dietaryRestrictions: ["vegetarian", "vegan"],
			email,
			firstName: "  Updated  ",
			id: targetUser.id,
			lastName: "  Participant  ",
			program: "software_engineering",
			role: Role.JUDGE,
			school: "SAIT"
		});

		expect(updated).toMatchObject({
			banned: true,
			completedRegistration: true,
			dietaryRestrictions: ["vegetarian", "vegan"],
			firstName: "Updated",
			lastName: "Participant",
			name: "Updated Participant",
			program: "software_engineering",
			role: Role.JUDGE,
			school: "SAIT"
		});
		expect(updated.email).toBe(email);
		expect(
			await db.query.user.findFirst({ where: eq(user.id, targetUser.id) })
		).toMatchObject({
			banned: true,
			completedRegistration: true,
			dietaryRestrictions: ["vegetarian", "vegan"],
			firstName: "Updated",
			lastName: "Participant",
			name: "Updated Participant",
			program: "software_engineering",
			role: Role.JUDGE,
			school: "SAIT"
		});
	});
});
