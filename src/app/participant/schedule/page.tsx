import type { Metadata } from "next";
import { AutoRefresh } from "@/app/components/participant/AutoRefresh";
import { ScheduleView } from "@/app/components/participant/schedule/ScheduleView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Schedule | Hack the Change"
};

export default async function SchedulePage() {
	await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const events = await api.events.getActiveEvents();

	return (
		<>
			<AutoRefresh />
			<ScheduleView events={events} />
		</>
	);
}
