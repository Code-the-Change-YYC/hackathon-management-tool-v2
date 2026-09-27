import AboutChallenge from "@/app/components/landing-page/AboutChallenge";
import EventDetails from "@/app/components/landing-page/EventDetails";
import Footer from "@/app/components/landing-page/Footer";
import Header from "@/app/components/landing-page/Header";
import Hero from "@/app/components/landing-page/Hero";
import Judges from "@/app/components/landing-page/Judges";
import JudgingCriteria from "@/app/components/landing-page/JudgingCriteria";
import MLHBadge from "@/app/components/landing-page/MLHBadge";
import Prizes from "@/app/components/landing-page/Prizes";
import Requirements from "@/app/components/landing-page/Requirements";
import Sponsors from "@/app/components/landing-page/Sponsors";
import Winners from "@/app/components/landing-page/Winners";
import { HydrateClient } from "@/trpc/server";

export const revalidate = 3600;

export default async function Home() {
	return (
		<HydrateClient>
			<Header />
			<MLHBadge />
			{/* Clips the decorative squiggles that hang past the viewport edges */}
			<main className="overflow-x-clip">
				<Hero />
				<EventDetails />
				<AboutChallenge />
				<Requirements />
				<Prizes />
				<JudgingCriteria />
				<Judges />
				<Winners />
				<Sponsors />
			</main>
			<Footer />
		</HydrateClient>
	);
}
