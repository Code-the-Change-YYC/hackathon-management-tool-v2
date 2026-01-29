import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";
import styles from "../dashboard.module.scss";

export default async function JudgePage() {
  const session = await requireRole([Role.JUDGE, Role.ADMIN]);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Judging Portal</h1>
        <div>
          <span>{session.user.name}</span>
          <span className={styles.roleBadge}>Judge</span>
        </div>
      </header>
      <div className={styles.content}>
        <div className={styles.card}>
          <h2 className={styles.welcome}>Ready to Judge?</h2>
          <p>View your assigned teams and submit scores.</p>
        </div>
      </div>
    </main>
  );
}
