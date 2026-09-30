import { redirect } from "next/navigation";
import {
	canAccessStep,
	getResumeStep,
	getSignedInHref,
	type OnboardingStep
} from "@/lib/onboarding";
import { AUTH_ROUTES, getDashboardHref, ONBOARDING_ROUTES } from "@/lib/routes";
import { getSession } from "@/server/better-auth/server";
import type { Role } from "@/types/types";

// Redirects to the home page when there is no session.
export async function requireAuth() {
	const session = await getSession();
	if (!session) {
		redirect("/");
	}
	return session;
}

// Redirects users without one of the allowed roles. Users who haven't finished
// registering don't have an app role yet, so they're sent back to onboarding.
export async function requireRole(allowedRoles: Role[]) {
	const session = await requireAuth();
	const userRole = session.user.role as Role;

	if (!allowedRoles.includes(userRole)) {
		redirect(
			session.user.completedRegistration ? "/" : ONBOARDING_ROUTES.start
		);
	}

	return session;
}

// For the login, sign-up, and verify-email pages: signed-in users are sent on
// to their dashboard, or to wherever they left off in onboarding.
export async function redirectSignedInUser() {
	const session = await getSession();
	if (session) {
		redirect(getSignedInHref(session.user));
	}
}

// Guards an onboarding step: requires a signed-in user who hasn't finished
// registering and has answered every step before this one.
export async function requireOnboardingStep(step: OnboardingStep) {
	const session = await getSession();
	if (!session) {
		redirect(AUTH_ROUTES.login);
	}

	const { user } = session;
	if (user.completedRegistration) {
		redirect(getDashboardHref(user.role));
	}
	if (!canAccessStep(user, step)) {
		redirect(ONBOARDING_ROUTES[getResumeStep(user)]);
	}

	return user;
}
