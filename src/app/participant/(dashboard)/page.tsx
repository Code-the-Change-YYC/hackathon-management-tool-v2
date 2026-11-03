import type { Metadata } from "next";
import { AutoRefresh } from "@/app/components/AutoRefresh";
import { DashboardView } from "@/app/components/participant/dashboard/DashboardView";
import { getNameParts } from "@/lib/names";
import { hasHackathonDayStarted } from "@/lib/participant-events";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Dashboard | Hack the Change"
};

export default async function DashboardPage() {
	const { user } = await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const [events, settings, progress, judging] = await Promise.all([
		api.events.getActiveEvents(),
		api.hackathonSettings.get(),
		api.judgingProgress.get(),
		api.judgingAssignments.getMine()
	]);

	return (
		<>
			<AutoRefresh />
			<DashboardView
				events={events}
				firstName={
					user.firstName || getNameParts(user.name).firstName || "Participant"
				}
				judging={judging}
				needsCheckIn={
					user.role === Role.PARTICIPANT &&
					!user.checkedIn &&
					hasHackathonDayStarted(settings?.startDate)
				}
				progress={progress}
				settings={settings}
			/>
		</>
	);
}
