import { ParticipantDashboard } from "@/app/components/participant/ParticipantDashboard";
import { getNameParts } from "@/lib/names";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";

export default async function ParticipantPage() {
	const { user } = await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	return (
		<ParticipantDashboard
			firstName={getNameParts(user.name).firstName || "Participant"}
		/>
	);
}
