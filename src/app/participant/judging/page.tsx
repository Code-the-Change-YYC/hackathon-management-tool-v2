import { tryCatch } from "@/lib/utils";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export default async function ParticipantJudgingPage() {
	const session = await requireRole([Role.PARTICIPANT, Role.ADMIN]);

	const { data: judgingAssignment } = await tryCatch(
		api.judgingAssignments.getMineForActiveRound()
	);

	return (
		<main className="flex min-h-screen flex-col bg-pale-grey font-sans text-dark-grey">
			<header className="flex items-center justify-between bg-awesomer-purple px-8 py-4 text-white shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
				<h1 className="m-0 font-bold text-2xl">Judging Schedule</h1>
				<div>
					<span>{session.user.name}</span>
					<span className="ml-4 inline-block rounded-full bg-white/20 px-3 py-1 font-semibold text-sm">
						Participant
					</span>
				</div>
			</header>
			<div className="mx-auto w-full max-w-300 p-8">
				<div className="mb-6 rounded-xl border border-light-grey bg-white p-8 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
					<h2 className="mb-4 font-semibold text-2xl text-grey-purple">
						Your Judging Time
					</h2>
					{judgingAssignment ? (
						<>
							<p>
								{judgingAssignment.team.name} judges at{" "}
								{judgingAssignment.timeSlot
									? judgingAssignment.timeSlot.toLocaleString()
									: "a time to be announced"}
								.
							</p>
							<p>Room: {judgingAssignment.room.name}</p>
							{judgingAssignment.room.roomLink ? (
								<p>
									Link:{" "}
									<a href={judgingAssignment.room.roomLink}>
										{judgingAssignment.room.roomLink}
									</a>
								</p>
							) : null}
						</>
					) : (
						<p>Your judging time has not been scheduled yet.</p>
					)}
				</div>
			</div>
		</main>
	);
}
