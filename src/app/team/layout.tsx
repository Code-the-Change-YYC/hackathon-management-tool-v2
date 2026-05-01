import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TeamFooter from "@/app/components/team/TeamFooter";
import TeamHeader from "@/app/components/team/TeamHeader";
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

	return (
		<div className="flex min-h-screen flex-col">
			<TeamHeader breadcrumbLabel="Join a Team" userName={session.user.name} />
			<main className="flex-1">{children}</main>
			<TeamFooter />
		</div>
	);
}
