/**
 * Onboarding runs in order: personal details, food preferences, the Discord
 * invite, then finding a team. Answers are saved step by step, so a returning
 * user resumes at the first step that still needs one. Registration is only
 * marked complete from the final team screen.
 */

import { getDashboardHref, ONBOARDING_ROUTES } from "@/lib/routes";

const STEPS = [
	"personalDetails",
	"foodPreferences",
	"discord",
	"team"
] as const;

export type OnboardingStep = (typeof STEPS)[number];

type RegistrationUser = {
	name: string;
	school?: string | null;
	wantsFood?: boolean | null;
	role?: string | null;
	completedRegistration?: boolean | null;
};

/** The earliest step with a missing answer, or Discord once nothing is missing. */
export function getResumeStep(user: RegistrationUser): OnboardingStep {
	if (!user.name.trim() || !user.school) return "personalDetails";
	if (user.wantsFood == null) return "foodPreferences";
	return "discord";
}

/**
 * Steps up to the resume step are open. The Discord and team steps save no
 * answers, so once the details are in, every step is open.
 */
export function canAccessStep(user: RegistrationUser, step: OnboardingStep) {
	return (
		hasRegistrationDetails(user) ||
		STEPS.indexOf(step) <= STEPS.indexOf(getResumeStep(user))
	);
}

export function hasRegistrationDetails(user: RegistrationUser) {
	return getResumeStep(user) === "discord";
}

/** Where a signed-in user belongs: their dashboard, or back into onboarding. */
export function getSignedInHref(user: RegistrationUser) {
	return user.completedRegistration
		? getDashboardHref(user.role)
		: ONBOARDING_ROUTES[getResumeStep(user)];
}
