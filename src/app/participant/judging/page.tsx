import { ParticipantJudging } from "@/app/components/participant/ParticipantJudging";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";

export default async function ParticipantJudgingPage() {
	await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	return <ParticipantJudging />;
}
