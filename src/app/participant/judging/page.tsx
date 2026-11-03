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
	const [progress, status, criteria, results] = await Promise.all([
		api.judgingProgress.get(),
		api.judgingProgress.getMine(),
		api.criteria.getPublic(),
		api.scores.getMineReleased()
	]);

	return (
		<>
			<AutoRefresh />
			<JudgingView
				criteria={criteria}
				progress={progress}
				results={results}
				status={status}
			/>
		</>
	);
}
