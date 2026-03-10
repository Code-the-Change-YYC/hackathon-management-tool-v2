/**
 * Temporary page to show the scoring table for judges
 */
"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import ModalPopup from "../components/judges/ModalPopup";
import ScoresTable from "../components/judges/ScoresTable";
import StatsPanel from "../components/judges/StatsPanel";

export default function JudgingDashboard() {
	const [selectedTeam, setSelectedTeam] = useState<{
		id: string;
		teamName: string;
	} | null>(null);

	// temp hardcoded fetching judging assignments
	const { data: assignments, isLoading: assignmentsLoading } =
		api.scores.getByRound.useQuery({
			roundId: "1e9a0b26-ad05-4da8-8116-e6c4b51672f9" // this can be replaced with the "id" column in the hackathon_judging_round table
		});

	// fetch judging criteria from db
	const { data: criteria, isLoading: criteriaLoading } =
		api.criteria.getAll.useQuery();

	if (assignmentsLoading || criteriaLoading || !assignments) {
		return <h1>Loading...</h1>;
	}

	const totalTeams = assignments.length;
	const teamsLeft = assignments.filter(
		(a) => (a.scores?.length ?? 0) === 0
	).length;

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
		<div className="flex w-dvw flex-col justify-center gap-4 p-8 py-6 xl:flex-row">
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
					assignments={assignments}
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
