import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/app/components/layout/AppShell";
import { auth } from "@/server/better-auth/config";
import { Role } from "@/types/types";

export default async function TeamLayout({
	children
}: {
	children: React.ReactNode;
}) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		redirect("/login");
	}

	const role = session.user.role as Role;
	if (role !== Role.PARTICIPANT && role !== Role.ADMIN) {
		redirect("/");
	}

	return <AppShell userName={session.user.name}>{children}</AppShell>;
}
