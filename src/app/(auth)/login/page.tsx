import type { Metadata } from "next";
import { AuthHeading } from "@/app/components/auth/AuthShell";
import { LoginForm } from "@/app/components/auth/LoginForm";
import { redirectSignedInUser } from "@/server/better-auth/auth-helpers/helpers";

export const metadata: Metadata = {
	title: "Log in | Hack the Change"
};

export default async function LoginPage({
	searchParams
}: {
	// Set when Google sign-in fails and sends the user back here.
	searchParams: Promise<{ error?: string | string[] }>;
}) {
	await redirectSignedInUser();
	const { error } = await searchParams;

	return (
		<>
			<AuthHeading title="Welcome back to Hack the Change 2026!" />
			<LoginForm googleError={Array.isArray(error) ? error[0] : error} />
		</>
	);
}
