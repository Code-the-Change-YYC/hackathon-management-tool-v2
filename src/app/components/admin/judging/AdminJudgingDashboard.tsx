"use client";
import { ArrowRightLine } from "@mingcute/react";
import Image from "next/image";
import { ConfirmAlertDialog } from "@/app/components/ConfirmAlertDialog";
import { Button } from "@/app/components/ui/button";
import PageHeader from "../../PageHeader";
import { AdminScheduleControls } from "./AdminScheduleControls";
import { AssignmentManagement } from "./AssignmentManagement";
import { CriteriaManagement } from "./CriteriaManagement";
import { ResultsManagement } from "./ResultsManagement";
import { RoomManagement } from "./RoomManagement";
import { RoundManagement } from "./RoundManagement";
import { useAdminJudgingSchedule } from "./useAdminJudgingSchedule";
export default function AdminJudgingDashboard() {
	const schedule = useAdminJudgingSchedule();
	const {
		dialogProps,
		selectedRoundId,
		setSelectedRoundId,
		setSelectedRoomId,
		setAssignmentMessage,
		slotMinutes
	} = schedule;

	return (
		<div className="min-h-screen bg-background text-foreground">
			<ConfirmAlertDialog {...dialogProps} />

			<main className="flex flex-col gap-6 p-6">
				<PageHeader
					description="Create a round, generate rooms and team slots, then review the schedule."
					title="Judging"
				/>

				<section className="relative flex min-h-74.75 flex-col overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground sm:block sm:min-h-37">
					<div className="relative z-10 max-w-100">
						<h2 className="m-0 font-semibold text-[28px] leading-9">
							Release Scores to Teams
						</h2>
						<p className="mt-4 mb-0 max-w-100 text-base leading-6">
							Let participants know how they scored in their projects now that
							the hackathon has ended!
						</p>
					</div>

					<div className="-bottom-8.5 sm:-top-17.5 pointer-events-none absolute inset-x-0 h-43.5 sm:inset-auto sm:right-0 sm:h-65 sm:w-130">
						<Image
							alt=""
							className="-rotate-[4deg] -bottom-2 absolute left-0 h-41.25 w-41.25 object-contain sm:top-0 sm:left-0 sm:h-62.5 sm:w-62.5"
							height={250}
							src="/images/admin-judging/gift.png"
							width={250}
						/>
						<Image
							alt=""
							className="-right-4 -bottom-2 absolute h-38.75 w-38.75 rotate-[9deg] object-contain sm:top-8 sm:right-2 sm:h-57.5 sm:w-57.5"
							height={230}
							src="/images/admin-judging/trophy.png"
							width={230}
						/>
					</div>

					<Button
						className="absolute bottom-4 left-4 z-20 sm:top-5 sm:right-5 sm:bottom-auto sm:left-auto"
						disabled
						title="Score release is not wired yet."
						type="button"
						variant="secondary"
					>
						Release scores
						<ArrowRightLine data-icon="inline-end" />
					</Button>
				</section>

				<RoundManagement
					onSelectRound={(roundId) => {
						setSelectedRoundId(roundId);
						setSelectedRoomId("all");
						setAssignmentMessage("");
					}}
					selectedRoundId={selectedRoundId}
				/>

				<AdminScheduleControls schedule={schedule} />
				<div className="mt-4 flex flex-col gap-16">
					<div className="flex flex-col gap-4">
						<div>
							<h2 className="m-0 font-medium text-[22px] leading-7">
								Adjustments
							</h2>
							<p className="mt-1 mb-0 text-muted-foreground text-sm">
								Optional. Edit meeting links, extra rooms, or a single team
								after generating the schedule.
							</p>
						</div>
						<RoomManagement roundId={selectedRoundId} />
						<AssignmentManagement
							roundId={selectedRoundId}
							slotMinutes={slotMinutes}
						/>
					</div>
					<CriteriaManagement />
					<ResultsManagement />
				</div>
			</main>
		</div>
	);
}
