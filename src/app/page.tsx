import { headers } from "next/headers";
import Link from "next/link";
import styles from "@/app/index.module.scss";
import { auth } from "@/server/better-auth/config";
import { HydrateClient } from "@/trpc/server";

export default async function Home() {
	const session = await auth.api.getSession({
		headers: await headers()
	});

	return (
		<HydrateClient>
			<main className={styles.main}>
				<div className={styles.container}>
					<h1 className={styles.title}>
						Create <span className={styles.pinkSpan}>T3</span> App
					</h1>
					<div className={styles.cardRow}>
						<Link
							className={styles.card}
							href="https://create.t3.gg/en/usage/first-steps"
							target="_blank"
						>
							<h3 className={styles.cardTitle}>First Steps →</h3>
							<div className={styles.cardText}>
								Just the basics - Everything you need to know to set up your
								database and authentication.
							</div>
						</Link>
						<Link
							className={styles.card}
							href="https://create.t3.gg/en/introduction"
							target="_blank"
						>
							<h3 className={styles.cardTitle}>Documentation →</h3>
							<div className={styles.cardText}>
								Learn more about Create T3 App, the libraries it uses, and how
								to deploy it.
							</div>
						</Link>
					</div>
					<div className={styles.cardRow}>
						<Link className={styles.card} href="/admin">
							<h3 className={styles.cardTitle}>Admin →</h3>
							<div className={styles.cardText}>Manage hackathon settings.</div>
						</Link>
						<Link className={styles.card} href="/judge">
							<h3 className={styles.cardTitle}>Judge →</h3>
							<div className={styles.cardText}>Judging portal.</div>
						</Link>
						<Link className={styles.card} href="/participant">
							<h3 className={styles.cardTitle}>Participant →</h3>
							<div className={styles.cardText}>Participant dashboard.</div>
						</Link>
					</div>
					<div className={styles.showcaseContainer}>
						<p className={styles.showcaseText}>Hackathon Management Tool</p>
					</div>

					<div className={styles.authContainer}>
						<p className={styles.showcaseText}>
							{session && <span>Logged in as {session.user?.name}</span>}
						</p>
					</div>
				</div>

				{session?.user && (
					<div className="text-center">Logged in as {session.user.name}</div>
				)}
			</main>
		</HydrateClient>
	);
}
