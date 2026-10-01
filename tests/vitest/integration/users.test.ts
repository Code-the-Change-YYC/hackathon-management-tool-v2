import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, onTestFinished } from "vitest";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { Role } from "@/types/types";
import { assertE2EDatabaseSafety } from "../../e2e/db";
import { createAuthenticatedCaller } from "../helpers/auth";

// Mid-registration users keep Better Auth's default role until they finish.
const newParticipant = { completedRegistration: false, name: "", role: "user" };

const personalDetails = {
	firstName: "Maria Anne",
	lastName: "De La Cruz",
	age: 17,
	phoneNumber: "403-555-0123",
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
