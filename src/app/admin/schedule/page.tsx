import type { Metadata } from "next";
import { ScheduleView } from "@/app/components/admin/schedule/ScheduleView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Schedule | Hack the Change"
};

export default async function AdminSchedulePage() {
	await requireRole([Role.ADMIN]);
	return <ScheduleView events={await api.events.getAllEvents()} />;
}
