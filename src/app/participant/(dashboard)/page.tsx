import type { Metadata } from "next";
import { AutoRefresh } from "@/app/components/AutoRefresh";
import { DashboardView } from "@/app/components/participant/dashboard/DashboardView";
import { getNameParts } from "@/lib/names";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Dashboard | Hack the Change"
};

export default async function DashboardPage() {
	const { user } = await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const [events, settings, rounds] = await Promise.all([
		api.events.getActiveEvents(),
		api.hackathonSettings.get(),
		api.judgingRounds.getAll()
	]);

	return (
		<>
			<AutoRefresh />
			<DashboardView
				events={events}
				firstName={
					user.firstName || getNameParts(user.name).firstName || "Participant"
				}
				rounds={rounds}
				settings={settings}
			/>
		</>
	);
}
