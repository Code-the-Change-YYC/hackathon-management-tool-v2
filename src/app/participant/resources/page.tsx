import type { Metadata } from "next";
import { ResourcesView } from "@/app/components/participant/resources/ResourcesView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Resources | Hack the Change"
};

export default async function ResourcesPage() {
	await requireRole([Role.PARTICIPANT, Role.ADMIN]);

	return <ResourcesView />;
}
