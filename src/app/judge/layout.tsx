import { redirect } from "next/navigation";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";
import { JudgeShell } from "../components/judges/JudgeShell";

export default async function JudgeLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	const session = await requireRole([Role.JUDGE, Role.ADMIN]);

	if (!session.user?.id) {
		redirect("/");
	}

	return (
		<JudgeShell
			userId={session.user.id}
			userName={session.user.name || "Judge"}
		>
			{children}
		</JudgeShell>
	);
}
