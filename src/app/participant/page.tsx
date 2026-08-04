import QRCode from "react-qr-code";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";
import styles from "../dashboard.module.scss";

export default async function ParticipantPage() {
	const session = await requireRole([Role.PARTICIPANT, Role.ADMIN]);

	let devpostStatus: Awaited<
		ReturnType<typeof api.teams.getMyDevpostSubmissionStatus>
	> | null = null;
	let judgingAssignment: Awaited<
		ReturnType<typeof api.judgingAssignments.getMineForActiveRound>
	> | null = null;

	try {
		devpostStatus = await api.teams.getMyDevpostSubmissionStatus();
	} catch {
		devpostStatus = null;
	}

	try {
		judgingAssignment = await api.judgingAssignments.getMineForActiveRound();
	} catch {
		judgingAssignment = null;
	}

	return (
		<main className={styles.main}>
			<header className={styles.header}>
				<h1 className={styles.title}>Participant Dashboard</h1>
				<div>
					<span>{session.user.name}</span>
					<span className={styles.roleBadge}>Participant</span>
				</div>
			</header>
			<div className={styles.content}>
				{devpostStatus?.showWarning ? (
					<div className={styles.warningCard}>
						<h2 className={styles.warningTitle}>Devpost Submission Required</h2>
						<p>
							Your team must submit a Devpost link before submissions close.
						</p>
						{devpostStatus.submissionCloseAt ? (
							<p className={styles.warningDeadline}>
								Submissions close on{" "}
								{devpostStatus.submissionCloseAt.toLocaleString()}.
							</p>
						) : null}
					</div>
				) : null}

				<div className={styles.card}>
					<h2 className={styles.welcome}>Judging Schedule</h2>
					{judgingAssignment ? (
						<>
							<p>
								{judgingAssignment.team.name} judges at{" "}
								{judgingAssignment.timeSlot
									? judgingAssignment.timeSlot.toLocaleString()
									: "a time to be announced"}
								.
							</p>
							<p>Room: {judgingAssignment.room.id.slice(0, 8)}</p>
							{judgingAssignment.room.roomLink ? (
								<p>Link: {judgingAssignment.room.roomLink}</p>
							) : null}
						</>
					) : (
						<p>Your judging time has not been scheduled yet.</p>
					)}
				</div>

				<div className={styles.card}>
					<h2 className={styles.welcome}>Welcome, Hacker!</h2>
					<p>Check your schedule, submit your project, and view results.</p>
				</div>
				<QRCode value={`${session.user.id}::${session.user.name}`} />
			</div>
		</main>
	);
}
