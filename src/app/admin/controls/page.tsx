import type { Metadata } from "next";
import { ControlsView } from "@/app/components/admin/controls/ControlsView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Admin Controls | Hack the Change"
};

export default async function ControlsPage() {
	await requireRole([Role.ADMIN]);
	const [criteria, settings] = await Promise.all([
		api.criteria.getAll(),
		api.hackathonSettings.get()
	]);

	return <ControlsView criteria={criteria} settings={settings} />;
}
