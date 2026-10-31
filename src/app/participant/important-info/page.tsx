import type { Metadata } from "next";
import { ImportantInfoView } from "@/app/components/participant/important-info/ImportantInfoView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Important Information | Hack the Change"
};

export default async function ImportantInfoPage() {
	await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	return <ImportantInfoView />;
}
