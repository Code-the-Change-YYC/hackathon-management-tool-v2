import AssignedTeamsTable from "../components/judges/AssignedTeamsTable";
import HelloJudgeHeader from "../components/judges/HelloJudgeHeader";
import StatCard from "../components/judges/StatCard";

export default function JudgePage() {
	return (
		<div className="space-y-6">
			<HelloJudgeHeader />
			<section aria-labelledby="assigned-teams-heading">
				<h2
					className="mb-3 pl-1 font-bold text-base text-dark-grey sm:text-lg"
					id="assigned-teams-heading"
				>
					Assigned Teams
				</h2>
				{/* Keeping these side by side matches the dashboard mockup once there is room. */}
				<div className="flex flex-col gap-5 md:flex-row md:items-start">
					<div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:w-40 md:shrink-0 md:grid-cols-1 lg:w-44">
						<StatCard
							caption="Teams Assigned to Room 1"
							icon="/svgs/judges/team_icon.svg"
							stat={10}
						/>
						<StatCard
							caption="Teams Left To Score"
							icon="/svgs/judges/teams_left.svg"
							stat={5}
						/>
					</div>
					<div className="min-w-0 flex-1">
						<AssignedTeamsTable />
					</div>
				</div>
			</section>
		</div>
	);
}
