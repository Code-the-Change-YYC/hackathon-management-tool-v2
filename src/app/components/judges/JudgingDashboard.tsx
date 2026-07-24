"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import ModalPopup from "./ModalPopup";
import ScoresTable from "./ScoresTable";
import StatsPanel from "./StatsPanel";

export default function JudgingDashboard() {
	const [selectedTeam, setSelectedTeam] = useState<{
		id: string;
		teamName: string;
	} | null>(null);

	const { data: settings, isLoading: settingsLoading } =
		api.hackathonSettings.get.useQuery();
	const activeRoundId = settings?.currentRoundId ?? "";

	const { data: assignments, isLoading: assignmentsLoading } =
		api.scores.getByRound.useQuery(
			{ roundId: activeRoundId },
			{ enabled: Boolean(activeRoundId) }
		);

	// fetch judging criteria from db
	const { data: criteria, isLoading: criteriaLoading } =
		api.criteria.getAll.useQuery();

	if (settingsLoading || assignmentsLoading || criteriaLoading) {
		return <h1>Loading...</h1>;
	}

	if (!activeRoundId) {
		return <h1>No active judging round has been selected.</h1>;
	}

	const visibleAssignments = assignments ?? [];
	const totalTeams = visibleAssignments.length;
	const teamsLeft = visibleAssignments.filter(
		(a) => (a.scores?.length ?? 0) === 0
	).length;

	// judging specific stats
	const panelData = [
		{
			icon: "/svgs/judges/team_icon.svg",
			alt: "Teams assigned icon",
			stat: totalTeams,
			text: totalTeams === 1 ? "Team Assigned" : "Teams Assigned"
		},
		{
			icon: "/svgs/judges/teams_left.svg",
			alt: "Teams left icon",
			stat: teamsLeft,
			text: teamsLeft === 1 ? "Team Left to Score" : "Teams Left to Score"
		}
	];

	const handleOpenModal = (assignmentId: string, teamName: string) => {
		setSelectedTeam({ id: assignmentId, teamName: teamName });
	};

	return (
		<div className="flex w-full flex-col justify-center gap-4 xl:flex-row">
			<div className="flex w-full flex-row gap-4 xl:w-1/4 xl:flex-col">
				{panelData.map((item) => (
					<StatsPanel
						alt={item.alt}
						icon={item.icon}
						key={item.text}
						stat={item.stat}
						subheader={item.text}
					/>
				))}
			</div>

			<div className="w-full xl:w-3/4">
				<ScoresTable
					assignments={visibleAssignments}
					criteria={criteria ?? []}
					onOpenModal={handleOpenModal}
				/>
			</div>

			{selectedTeam && (
				<ModalPopup
					assignmentId={selectedTeam.id}
					criteria={criteria ?? []}
					onClose={() => setSelectedTeam(null)}
					teamName={selectedTeam.teamName}
				/>
			)}
		</div>
	);
}
