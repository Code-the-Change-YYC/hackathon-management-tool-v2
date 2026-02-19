import TeamTable from "@/app/components/admin/teamtable/TeamTable";
import UserTable from "@/app/components/admin/usertable";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";
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
				</div>
			</div>
			<div>
				<div>
					<h2 className={styles.sectionTitle}>Users</h2>
					<UserTable />
				</div>
				<div>
					<h2 className={styles.sectionTitle}>Teams</h2>
					<TeamTable />
				</div>
			</div>
		</main>
	);
}
