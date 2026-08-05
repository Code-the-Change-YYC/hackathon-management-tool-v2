import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";
import styles from "../../dashboard.module.scss";

export default async function ParticipantJudgingPage() {
	const session = await requireRole([Role.PARTICIPANT, Role.ADMIN]);

	let judgingAssignment: Awaited<
		ReturnType<typeof api.judgingAssignments.getMineForActiveRound>
	> | null = null;

	try {
		judgingAssignment = await api.judgingAssignments.getMineForActiveRound();
	} catch {
		judgingAssignment = null;
	}

	return (
		<main className={styles.main}>
			<header className={styles.header}>
				<h1 className={styles.title}>Judging Schedule</h1>
				<div>
					<span>{session.user.name}</span>
					<span className={styles.roleBadge}>Participant</span>
				</div>
			</header>
			<div className={styles.content}>
				<div className={styles.card}>
					<h2 className={styles.welcome}>Your Judging Time</h2>
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
