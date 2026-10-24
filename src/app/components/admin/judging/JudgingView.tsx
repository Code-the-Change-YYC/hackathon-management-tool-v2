"use client";

import { ConfirmAlertDialog } from "@/app/components/ConfirmAlertDialog";
import PageHeader from "@/app/components/PageHeader";
import { AdminScheduleControls } from "./AdminScheduleControls";
import { AssignmentManagement } from "./AssignmentManagement";
import { CriteriaManagement } from "./CriteriaManagement";
import type {
	Assignment,
	Criterion,
	Judge,
	Ranking,
	RoomLayouts,
	Round,
	Team
} from "./judgingShared";
import { ReleaseScoresBanner } from "./ReleaseScoresBanner";
import { ResultsManagement } from "./ResultsManagement";
import { RoomManagement } from "./RoomManagement";
import { RoundManagement } from "./RoundManagement";
import { useAdminJudgingSchedule } from "./useAdminJudgingSchedule";

export function JudgingView({
	rounds,
	activeRoundId,
	layouts,
	assignments,
	judges,
	teams,
	criteria,
	rankings
}: {
	rounds: Round[];
	activeRoundId: string | null;
	layouts: RoomLayouts;
	assignments: Assignment[];
	judges: Judge[];
	teams: Team[];
	criteria: Criterion[];
	rankings: Ranking[];
}) {
	const schedule = useAdminJudgingSchedule({
		rounds,
		activeRoundId,
		layouts,
		assignments,
		judges,
		teams
	});

	return (
		<div className="flex flex-col gap-6">
			<ConfirmAlertDialog {...schedule.dialogProps} />
			<PageHeader
				description="Create a round, generate rooms and team slots, then review the schedule."
				title="Judging"
			/>

			<ReleaseScoresBanner />

			<RoundManagement
				activeRoundId={activeRoundId}
				assignments={assignments}
				onSelectRound={schedule.selectRound}
				rounds={rounds}
			/>

			<AdminScheduleControls schedule={schedule} />
			<div className="mt-4 flex flex-col gap-16">
				<div className="flex flex-col gap-4">
					<div>
						<h2 className="font-medium text-xl">Adjustments</h2>
						<p className="mt-1 mb-0 text-muted-foreground text-sm">
							Optional. Edit meeting links, extra rooms, or a single team after
							generating the schedule.
						</p>
					</div>
					<RoomManagement
						assignments={schedule.roundAssignments}
						judges={judges}
						key={schedule.selectedRoundId}
						rooms={schedule.rooms}
						roundId={schedule.selectedRoundId}
					/>
					<AssignmentManagement
						assignments={schedule.roundAssignments}
						eligibleTeams={schedule.eligibleTeams}
						rooms={schedule.rooms}
						round={schedule.selectedRound}
						slotMinutes={schedule.slotMinutes}
					/>
				</div>
				<CriteriaManagement criteria={criteria} rounds={rounds} />
				<ResultsManagement rankings={rankings} />
			</div>
		</div>
	);
}
