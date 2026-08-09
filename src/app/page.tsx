import Sponsors from "@/app/components/admin/landingpage/Sponsors";
import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import { HydrateClient } from "@/trpc/server";
import AboutChallenge from "./components/admin/landingpage/AboutChallenge";
import Countdown from "./components/admin/landingpage/countdown/Countdown";
import EventDetails from "./components/admin/landingpage/EventDetails";
import HackathonInformationContainer from "./components/admin/landingpage/HackathonInformationContainer";
import Prizes from "./components/admin/landingpage/Prizes";
import Requirements from "./components/admin/landingpage/Requirements";
import Winners from "./components/admin/landingpage/Winners";

export default async function Home() {
	// TODO: replace with real team-membership check. addressing this later as the whole participant flow to be fixed in a seperate PR (HMTV2-39)
	const hasTeam = false;

	return (
		<HydrateClient>
			<Header hasTeam={hasTeam} />
			<Countdown />
			<EventDetails />
			<HackathonInformationContainer>
				<AboutChallenge />
				<Requirements />
				<Prizes />
				<Winners />
			</HackathonInformationContainer>
			<Sponsors />
			<Footer />
		</HydrateClient>
	);
}
