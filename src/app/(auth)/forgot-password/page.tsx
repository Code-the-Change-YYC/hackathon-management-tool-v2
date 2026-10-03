import type { Metadata } from "next";
import { z } from "zod";
import { AuthHeading } from "@/app/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/app/components/auth/ForgotPasswordForm";
import { redirectSignedInUser } from "@/server/better-auth/auth-helpers/helpers";

export const metadata: Metadata = {
	title: "Forgot your password? | Hack the Change"
};

export default async function ForgotPasswordPage({
	searchParams
}: {
	// Carried over from the login form, when an email was typed there.
	searchParams: Promise<{ email?: string | string[] }>;
}) {
	await redirectSignedInUser();
	const email = z
		.string()
		.email()
		.safeParse((await searchParams).email);

	return (
		<>
			<AuthHeading
				description="Enter the email you signed up with and we'll send you a code to choose a new password."
				title="Forgot your password?"
			/>
			<ForgotPasswordForm email={email.success ? email.data : ""} />
		</>
	);
}
