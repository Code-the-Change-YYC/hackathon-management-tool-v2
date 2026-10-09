import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AuthHeading } from "@/app/components/auth/AuthShell";
import { VerifyEmailForm } from "@/app/components/auth/VerifyEmailForm";
import { AUTH_ROUTES } from "@/lib/routes";
import { redirectSignedInUser } from "@/server/better-auth/auth-helpers/helpers";

export const metadata: Metadata = {
	title: "Verify your email | Hack the Change"
};

export default async function VerifyEmailPage({
	searchParams
}: {
	searchParams: Promise<{ email?: string | string[] }>;
}) {
	await redirectSignedInUser();
	const email = z
		.string()
		.email()
		.safeParse((await searchParams).email);
	if (!email.success) {
		redirect(AUTH_ROUTES.signup);
	}

	return (
		<>
			<AuthHeading
				description={
					<>
						We sent an email with a one-time code to{" "}
						<span className="font-medium">{email.data}</span>
					</>
				}
				title="Verify your email"
			/>
			<VerifyEmailForm email={email.data} />
		</>
	);
}
