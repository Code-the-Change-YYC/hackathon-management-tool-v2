import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AuthHeading } from "@/app/components/auth/AuthShell";
import { ResetPasswordForm } from "@/app/components/auth/ResetPasswordForm";
import { AUTH_ROUTES } from "@/lib/routes";
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
			<AuthHeading>Reset your password</AuthHeading>
			<ResetPasswordForm email={email.data} />
		</>
	);
}
