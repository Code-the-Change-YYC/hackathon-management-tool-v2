import { DASHBOARD_HREFS } from "@/lib/constants";
import { Role } from "@/types/types";

export const AUTH_ROUTES = {
	login: "/login",
	signup: "/signup",
	verifyEmail: "/verify-email",
	forgotPassword: "/forgot-password",
	resetPassword: "/reset-password"
} as const;

export const ONBOARDING_ROUTES = {
	start: "/onboarding",
	personalDetails: "/onboarding/personal-details",
	foodPreferences: "/onboarding/food-preferences",
	mlhPolicies: "/onboarding/mlh-policies",
	discord: "/onboarding/discord",
	team: "/onboarding/team",
	joinTeam: "/onboarding/team/join",
	teamJoined: "/onboarding/team/joined",
	registerTeam: "/onboarding/team/register",
	teamRegistered: "/onboarding/team/registered",
	findTeam: "/onboarding/team/find"
} as const;

export function getVerifyEmailHref(email: string) {
	return `${AUTH_ROUTES.verifyEmail}?${new URLSearchParams({ email })}`;
}

/** Carries over whatever was typed in the login form's email field. */
export function getForgotPasswordHref(email: string) {
	const trimmed = email.trim();
	return trimmed
		? `${AUTH_ROUTES.forgotPassword}?${new URLSearchParams({ email: trimmed })}`
		: AUTH_ROUTES.forgotPassword;
}

export function getResetPasswordHref(email: string) {
	return `${AUTH_ROUTES.resetPassword}?${new URLSearchParams({ email })}`;
}

/** Users without an app role yet (mid-registration) land on the participant dashboard. */
export function getDashboardHref(role: string | null | undefined) {
	return DASHBOARD_HREFS[role as Role] ?? DASHBOARD_HREFS[Role.PARTICIPANT];
}
