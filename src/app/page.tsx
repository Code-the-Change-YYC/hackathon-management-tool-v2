import { headers } from "next/headers";
import Link from "next/link";
import Sponsors from "@/app/components/admin/landingpage/Sponsors";
import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import styles from "@/app/index.module.scss";
import { auth } from "@/server/better-auth/config";
import { HydrateClient } from "@/trpc/server";
import AboutChallenge from "./components/admin/landingpage/AboutChallenge";
import Countdown from "./components/admin/landingpage/Countdown";
import EventDetails from "./components/admin/landingpage/EventDetails";
import Judges from "./components/admin/landingpage/Judges";
import JudgingCriteria from "./components/admin/landingpage/JudgingCriteria";
import Prizes from "./components/admin/landingpage/Prizes";
import Requirements from "./components/admin/landingpage/Requirements";

export default async function Home() {
	const session = await auth.api.getSession({
		headers: await headers()
	});

	const hasTeam = false;

	return (
		<HydrateClient>
			<Header hasTeam={hasTeam} isSignedIn={!!session?.user} />
			<Countdown />
			<EventDetails />
			<AboutChallenge />
			<Requirements />
			<Prizes />
			<Judges />
			<main className={styles.main}>
				<div className={styles.container}>
					<h1 className={styles.title}>
						Create <span className={styles.pinkSpan}>T3</span> App
					</h1>
					{session?.user && (
						<div className="text-center">Logged in as {session.user.name}</div>
					)}
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
						<Link className={styles.card} href="/login">
							<h3 className={styles.cardTitle}>Login →</h3>
							<div className={styles.cardText}>Login to the app.</div>
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
				<JudgingCriteria />
				<Sponsors />
			</main>
			<Footer />
		</HydrateClient>
	);
}
