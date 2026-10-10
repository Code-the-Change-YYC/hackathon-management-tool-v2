import { redirect } from "next/navigation";
import { getSignedInHref } from "@/lib/onboarding";
import { AUTH_ROUTES } from "@/lib/routes";
import { getSession } from "@/server/better-auth/server";

// Entry point after signing in (Google returns here too): sends each user to
// the step they left off at, or to their dashboard once registered.
export default async function OnboardingPage() {
	const session = await getSession();
	if (!session) {
		redirect(AUTH_ROUTES.login);
	}
	redirect(getSignedInHref(session.user));
}
