import { describe, expect, it } from "vitest";
import {
	canAccessStep,
	getResumeStep,
	getSignedInHref
} from "@/lib/onboarding";
import { ONBOARDING_ROUTES } from "@/lib/routes";

const newUser = { name: "", school: null, wantsFood: null };
const userWithDetails = {
	name: "E2E Participant",
	school: "University of Calgary",
	wantsFood: false
};

describe("onboarding steps", () => {
	it("resumes at the first step that still needs an answer", () => {
		expect(getResumeStep(newUser)).toBe("personalDetails");
		expect(getResumeStep({ ...userWithDetails, wantsFood: null })).toBe(
			"foodPreferences"
		);
		expect(getResumeStep(userWithDetails)).toBe("discord");
	});

	it("keeps steps closed until the answers before them are in", () => {
		expect(canAccessStep(newUser, "personalDetails")).toBe(true);
		expect(canAccessStep(newUser, "foodPreferences")).toBe(false);
		expect(canAccessStep(newUser, "team")).toBe(false);
	});

	it("opens the team step once the details are in", () => {
		expect(canAccessStep(userWithDetails, "discord")).toBe(true);
		expect(canAccessStep(userWithDetails, "team")).toBe(true);
	});

	it("sends users who haven't finished back to their resume step", () => {
		expect(getSignedInHref(userWithDetails)).toBe(ONBOARDING_ROUTES.discord);
	});
});
