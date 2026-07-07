import Link from "next/link";
import TeamTable from "@/app/components/admin/teamtable/TeamTable";
import UserTable from "@/app/components/admin/usertable";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";
import CriteriaTable from "../components/admin/criteriaTable/CriteriaTable";
import HackathonSettingsPanel from "../components/admin/hackathonSettings/HackathonSettingsPanel";
import JudgingAssignmentsTable from "../components/admin/judgingAssignmentsTable/JudgingAssignmentsTable";
import JudgingRoomsManager from "../components/admin/judgingRooms/JudgingRoomsManager";
import JudgingRoundsTable from "../components/admin/judgingRounds/JudgingRoundsTable";
import ScoreTable from "../components/admin/scoreTable/ScoreTable";
import styles from "../dashboard.module.scss";

export default async function AdminPage() {
	const session = await requireRole([Role.ADMIN]);

	return (
		<main className={styles.main}>
			<header className={styles.header}>
				<h1 className={styles.title}>Hackathon Admin</h1>
				<div>
					<span>{session.user.name}</span>
					<span className={styles.roleBadge}>Admin</span>
				</div>
			</header>
			<div className={styles.content}>
				<div className={styles.card}>
					<h2 className={styles.welcome}>Welcome back, Admin!</h2>
					<p>Manage your hackathon settings, users, and rounds here.</p>
					<Link href="/admin/judge">Open the judging workspace →</Link>
				</div>
			</div>
			<div>
				<div id="settings">
					<h2 className={styles.sectionTitle}>Hackathon Settings</h2>
					<HackathonSettingsPanel />
				</div>
				<div id="users">
					<h2 className={styles.sectionTitle}>Users</h2>
					<UserTable />
				</div>
				<div id="teams">
					<h2 className={styles.sectionTitle}>Teams</h2>
					<TeamTable />
				</div>
				<div>
					<h2 className={styles.sectionTitle}>Criteria</h2>
					<CriteriaTable />
				</div>
				<div>
					<h2 className={styles.sectionTitle}>Judging Rounds</h2>
					<JudgingRoundsTable />
				</div>
				<div>
					<h2 className={styles.sectionTitle}>Judging Assignments</h2>
					<JudgingAssignmentsTable />
				</div>
				<div>
					<h2 className={styles.sectionTitle}>Judging Rooms</h2>
					<JudgingRoomsManager />
				</div>
				<div>
					<h2 className={styles.sectionTitle}>Scores</h2>
					<ScoreTable />
				</div>
			</div>
		</main>
	);
}
