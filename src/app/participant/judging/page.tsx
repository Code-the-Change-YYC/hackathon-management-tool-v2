import type { Metadata } from "next";
import { AutoRefresh } from "@/app/components/AutoRefresh";
import { JudgingView } from "@/app/components/participant/judging/JudgingView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Judging | Hack the Change"
};

export default async function JudgingPage() {
	await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const [settings, events, rounds, criteria, judging, results] =
		await Promise.all([
			api.hackathonSettings.get(),
			api.events.getActiveEvents(),
			api.judgingRounds.getAll(),
			api.criteria.getAll(),
			api.judgingAssignments.getMine(),
			api.scores.getMineReleased()
		]);

	return (
		<>
			<AutoRefresh />
			<JudgingView
				criteria={criteria}
				events={events}
				judging={judging}
				results={results}
				rounds={rounds}
				settings={settings}
			/>
		</>
	);
}
