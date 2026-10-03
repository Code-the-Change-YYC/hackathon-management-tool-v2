import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AuthHeading } from "@/app/components/auth/AuthShell";
import { ResetPasswordForm } from "@/app/components/auth/ResetPasswordForm";
import { AUTH_ROUTES, getForgotPasswordHref } from "@/lib/routes";
import { redirectSignedInUser } from "@/server/better-auth/auth-helpers/helpers";

export const metadata: Metadata = {
	title: "Reset your password | Hack the Change"
};

export default async function ResetPasswordPage({
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
		redirect(AUTH_ROUTES.forgotPassword);
	}

	return (
		<>
			<AuthHeading
				description={
					<>
						If <span className="font-medium">{email.data}</span> has an account,
						we sent it an email with a one-time code.{" "}
						<Link className="link" href={getForgotPasswordHref(email.data)}>
							Use a different email
						</Link>
					</>
				}
				title="Reset your password"
			/>
			<ResetPasswordForm email={email.data} />
		</>
	);
}
