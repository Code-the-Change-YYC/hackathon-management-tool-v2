import { beforeAll, describe, expect, it, onTestFinished } from "vitest";
import { DIETARY_RESTRICTIONS } from "@/lib/validation/signup";
import { Role } from "@/types/types";
import { assertE2EDatabaseSafety } from "../../e2e/db";
import { createTestUser } from "../../utils/auth";
import {
	createAuthenticatedCaller,
	createUnauthenticatedCaller
} from "../helpers/auth";

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
