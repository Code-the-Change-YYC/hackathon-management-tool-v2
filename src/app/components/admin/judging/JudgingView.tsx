"use client";

import PageHeader from "@/app/components/PageHeader";
import { CriteriaManagement } from "./CriteriaManagement";
import { FinalRoundManagement } from "./FinalRoundManagement";
import type {
	Assignment,
	Criterion,
	FinalResults,
	Judge,
	Layouts,
	PanelRanking,
	Round,
	Team
} from "./judgingShared";
import { PanelScheduleManagement } from "./PanelScheduleManagement";
import { ReleaseScoresBanner } from "./ReleaseScoresBanner";
import { RoundManagement } from "./RoundManagement";

export function JudgingView({
	rounds,
	activeRoundId,
	layouts,
	assignments,
	judges,
	teams,
	criteria,
	rankings,
	finalResults
}: {
	rounds: Round[];
	activeRoundId: string | null;
	layouts: Layouts;
	assignments: Assignment[];
	judges: Judge[];
	teams: Team[];
	criteria: Criterion[];
	rankings: Record<string, PanelRanking[]>;
	finalResults: FinalResults;
}) {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Create a panel round, generate its tables and times, then pick finalists from the results."
				title="Judging"
			/>

			<ReleaseScoresBanner />

			<RoundManagement
				activeRoundId={activeRoundId}
				assignments={assignments}
				rounds={rounds}
			/>
			<PanelScheduleManagement
				activeRoundId={activeRoundId}
				judges={judges}
				layouts={layouts}
				rounds={rounds}
				teams={teams}
			/>
			<CriteriaManagement criteria={criteria} rounds={rounds} />
			<FinalRoundManagement
				finalResults={finalResults}
				layouts={layouts}
				rankings={rankings}
				rounds={rounds}
			/>
		</div>
	);
}
