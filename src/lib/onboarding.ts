/**
 * Onboarding runs in order: personal details, food preferences, the MLH
 * policies, the Discord invite, then finding a team. Answers are saved step
 * by step, so a returning user resumes at the first step that still needs
 * one. Registration is only marked complete from the final team screen.
 */

import { getDashboardHref, ONBOARDING_ROUTES } from "@/lib/routes";

export const ONBOARDING_STEPS = [
	"personalDetails",
	"foodPreferences",
	"mlhPolicies",
	"discord",
	"team"
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

type RegistrationUser = {
	firstName?: string | null;
	lastName?: string | null;
	age?: number | null;
	phoneNumber?: string | null;
	countryOfResidence?: string | null;
	school?: string | null;
	levelOfStudy?: string | null;
	wantsFood?: boolean | null;
	mlhCodeOfConductAcceptedAt?: Date | null;
	mlhDataSharingAcceptedAt?: Date | null;
	role?: string | null;
	completedRegistration?: boolean | null;
};

function hasPersonalDetails(user: RegistrationUser) {
	return Boolean(
		user.firstName?.trim() &&
			user.lastName?.trim() &&
			user.age != null &&
			user.phoneNumber &&
			user.countryOfResidence &&
			user.school &&
			user.levelOfStudy
	);
}

function hasAcceptedMlhPolicies(user: RegistrationUser) {
	return Boolean(
		user.mlhCodeOfConductAcceptedAt && user.mlhDataSharingAcceptedAt
	);
}

/** The earliest step with a missing answer, or Discord once nothing is missing. */
export function getResumeStep(user: RegistrationUser): OnboardingStep {
	if (!hasPersonalDetails(user)) return "personalDetails";
	if (user.wantsFood == null) return "foodPreferences";
	if (!hasAcceptedMlhPolicies(user)) return "mlhPolicies";
	return "discord";
}

/**
 * Steps up to the resume step are open. The Discord and team steps save no
 * answers, so once the details are in, every step is open.
 */
export function canAccessStep(user: RegistrationUser, step: OnboardingStep) {
	return (
		hasRegistrationDetails(user) ||
		ONBOARDING_STEPS.indexOf(step) <=
			ONBOARDING_STEPS.indexOf(getResumeStep(user))
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
