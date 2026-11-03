import type { Metadata } from "next";
import { z } from "zod";
import { JudgeLoginForm } from "@/app/components/auth/JudgeLoginForm";
import { redirectSignedInUser } from "@/server/better-auth/auth-helpers/helpers";

export const metadata: Metadata = {
	title: "Judge sign in | Hack the Change"
};

export default async function JudgeLoginPage({
	searchParams
}: {
	// Filled in by the link in the judge access email.
	searchParams: Promise<{ email?: string | string[] }>;
}) {
	await redirectSignedInUser();
	const email = z
		.string()
		.email()
		.safeParse((await searchParams).email);

	return <JudgeLoginForm email={email.success ? email.data : ""} />;
}
