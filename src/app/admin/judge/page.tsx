import AdminJudgingDashboard from "@/app/components/admin/judging/AdminJudgingDashboard";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";

export default async function AdminJudgePage() {
	const session = await requireRole([Role.ADMIN]);

	return <AdminJudgingDashboard userName={session.user.name} />;
}
