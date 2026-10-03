import { describe, expect, it } from "vitest";
import {
	canAccessStep,
	getResumeStep,
	getSignedInHref
} from "@/lib/onboarding";
import { ONBOARDING_ROUTES } from "@/lib/routes";

const newUser = { firstName: null, school: null, wantsFood: null };
const userWithDetails = {
	firstName: "E2E",
	lastName: "Participant",
	age: 20,
	phoneNumber: "+14035550100",
	countryOfResidence: "CA",
	school: "University of Calgary",
	levelOfStudy: "undergraduate_three_plus_year",
	wantsFood: false,
	mlhCodeOfConductAcceptedAt: new Date(),
	mlhDataSharingAcceptedAt: new Date()
};

describe("onboarding steps", () => {
	it("resumes at the first step that still needs an answer", () => {
		expect(getResumeStep(newUser)).toBe("personalDetails");
		expect(getResumeStep({ ...userWithDetails, phoneNumber: null })).toBe(
			"personalDetails"
		);
		expect(getResumeStep({ ...userWithDetails, wantsFood: null })).toBe(
			"foodPreferences"
		);
		expect(
			getResumeStep({ ...userWithDetails, mlhDataSharingAcceptedAt: null })
		).toBe("mlhPolicies");
		expect(getResumeStep(userWithDetails)).toBe("discord");
	});

	it("keeps steps closed until the answers before them are in", () => {
		expect(canAccessStep(newUser, "personalDetails")).toBe(true);
		expect(canAccessStep(newUser, "foodPreferences")).toBe(false);
		expect(canAccessStep(newUser, "team")).toBe(false);
		expect(
			canAccessStep(
				{ ...userWithDetails, mlhCodeOfConductAcceptedAt: null },
				"discord"
			)
		).toBe(false);
	});

	it("opens the team step once the details are in", () => {
		expect(canAccessStep(userWithDetails, "discord")).toBe(true);
		expect(canAccessStep(userWithDetails, "team")).toBe(true);
	});

	it("sends users who haven't finished back to their resume step", () => {
		expect(getSignedInHref(userWithDetails)).toBe(ONBOARDING_ROUTES.discord);
	});
});
