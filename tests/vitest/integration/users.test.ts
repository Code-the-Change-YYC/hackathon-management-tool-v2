import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, onTestFinished } from "vitest";
import { DIETARY_RESTRICTIONS } from "@/lib/validation/signup";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
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
