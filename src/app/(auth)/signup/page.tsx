import type { Metadata } from "next";
import { AuthHeading } from "@/app/components/auth/AuthShell";
import { SignupForm } from "@/app/components/auth/SignupForm";
import { redirectSignedInUser } from "@/server/better-auth/auth-helpers/helpers";

export const metadata: Metadata = {
	title: "Sign up | Hack the Change"
};

export default async function SignupPage({
	searchParams
}: {
	// Set when Google sign-in fails and sends the user back here.
	searchParams: Promise<{ error?: string | string[] }>;
}) {
	await redirectSignedInUser();
	const { error } = await searchParams;

	return (
		<>
			<AuthHeading>Welcome to Hack the Change 2026!</AuthHeading>
			<SignupForm googleFailed={Boolean(error)} />
		</>
	);
}
