import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";
import { JudgeShell } from "../components/judges/JudgePortal";

export default async function JudgeLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	const session = await requireRole([Role.JUDGE, Role.ADMIN]);

	return (
		<JudgeShell
			userId={session.user.id}
			userName={session.user.name || "Judge"}
		>
			{children}
		</JudgeShell>
	);
}
