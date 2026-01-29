import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";
import styles from "../dashboard.module.scss";

export default async function ParticipantPage() {
	const session = await requireRole([Role.PARTICIPANT, Role.ADMIN]);

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
				<div className={styles.card}>
					<h2 className={styles.welcome}>Welcome, Hacker!</h2>
					<p>Check your schedule, submit your project, and view results.</p>
				</div>
			</div>
		</main>
	);
}
