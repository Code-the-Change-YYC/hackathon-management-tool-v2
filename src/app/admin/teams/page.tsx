import TeamTable from "@/app/components/admin/teamtable/TeamTable";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";

export default async function Teams() {
	await requireRole([Role.ADMIN]);

	return (
		<main className="flex size-full flex-1 flex-col overflow-y-auto bg-white">
			<TeamTable />
		</main>
	);
}
