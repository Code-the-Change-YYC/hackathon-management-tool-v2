import Footer from "@/app/components/landing-page/Footer";
import Header from "@/app/components/landing-page/Header";
import Sponsors from "@/app/components/landing-page/Sponsors";
import { HydrateClient } from "@/trpc/server";
import AboutChallenge from "./components/landing-page/AboutChallenge";
import Countdown from "./components/landing-page/countdown/Countdown";
import EventDetails from "./components/landing-page/EventDetails";
import HackathonInformationContainer from "./components/landing-page/HackathonInformationContainer";
import Judges from "./components/landing-page/Judges";
import JudgingCriteria from "./components/landing-page/JudgingCriteria";
import MLHBadge from "./components/landing-page/MLHBadge";
import Prizes from "./components/landing-page/Prizes";
import Requirements from "./components/landing-page/Requirements";
import Winners from "./components/landing-page/Winners";

export const revalidate = 3600;

export default async function Home() {
	return (
		<HydrateClient>
			<Header />
			<MLHBadge />
			<Countdown />
			<EventDetails />
			<HackathonInformationContainer>
				<AboutChallenge />
				<Requirements />
				<Prizes />
				<JudgingCriteria />
				<Judges />
				<Winners />
			</HackathonInformationContainer>
			<Sponsors />
			<Footer />
		</HydrateClient>
	);
}
