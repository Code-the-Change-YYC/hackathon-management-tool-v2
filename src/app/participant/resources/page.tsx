import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResourcesView } from "@/app/components/participant/resources/ResourcesView";
import { hasHackathonStarted } from "@/lib/participant-events";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Resources and Help | Hack the Change"
};

export default async function ResourcesPage() {
	await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const settings = await api.hackathonSettings.get();
	if (!hasHackathonStarted(settings?.startDate)) {
		redirect("/participant");
	}

	return <ResourcesView />;
}
