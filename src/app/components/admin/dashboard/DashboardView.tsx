import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import type { RouterOutputs } from "@/trpc/react";
import { CriteriaTable } from "./criteriaTable/CriteriaTable";
import type { Criteria } from "./criteriaTable/columns";
import { HackathonSettingsPanel } from "./HackathonSettingsPanel";
import { ScoreTable } from "./ScoreTable";
import { TeamTable } from "./TeamTable";
import { UserTable } from "./UserTable";

const SECTIONS = [
	{ id: "settings", title: "Hackathon Settings" },
	{ id: "users", title: "Users" },
	{ id: "teams", title: "Teams" },
	{ id: "criteria", title: "Criteria" },
	{ id: "scores", title: "Scores" }
] as const;

export function DashboardView({
	settings,
	rounds,
	users,
	teams,
	criteria,
	rankings
}: {
	settings: RouterOutputs["hackathonSettings"]["get"];
	rounds: RouterOutputs["judgingRounds"]["getAll"];
	users: RouterOutputs["users"]["getAll"];
	teams: RouterOutputs["teams"]["getAll"];
	criteria: Criteria[];
	rankings: RouterOutputs["teams"]["getRankings"];
}) {
	const content = {
		settings: <HackathonSettingsPanel rounds={rounds} settings={settings} />,
		users: <UserTable users={users} />,
		teams: <TeamTable teams={teams} />,
		criteria: <CriteriaTable criteria={criteria} />,
		scores: <ScoreTable rankings={rankings} />
	};

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Manage hackathon settings, users, teams, criteria, and scores."
				title="Admin Dashboard"
			/>
			<p className="text-sm">
				Judging rounds, rooms, and scheduling live on the{" "}
				<Link
					className="text-primary underline-offset-4 hover:underline"
					href="/admin/judging"
				>
					Judging Information
				</Link>{" "}
				page.
			</p>
			{SECTIONS.map(({ id, title }) => (
				<section
					aria-labelledby={`${id}-title`}
					className="flex scroll-mt-6 flex-col gap-4"
					id={id}
					key={id}
				>
					<h2 className="font-medium text-xl" id={`${id}-title`}>
						{title}
					</h2>
					{content[id]}
				</section>
			))}
		</div>
	);
}
