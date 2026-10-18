import Banner from "@/app/components/Banner";
import {
	type DashboardEvent,
	eventNavigationUrlSchema
} from "@/lib/participant-events";
import CurrentEventImages from "./CurrentEventImages";

export function CurrentEventBanner({
	event,
	colour
}: {
	event?: DashboardEvent;
	colour: "purple" | "red";
}) {
	if (!event) {
		return (
			<Banner
				buttonText="Navigate there"
				colour={colour}
				description="We’re getting the next event ready. Check back soon for schedule details."
				image={<CurrentEventImages />}
				title="Hackathon updates coming soon"
			/>
		);
	}
	const navigationUrl = eventNavigationUrlSchema.safeParse(event.navigationUrl);
	return (
		<Banner
			buttonText="Navigate there"
			colour={colour}
			description={event.description}
			endTime={event.endTime}
			href={navigationUrl.success ? navigationUrl.data : undefined}
			image={<CurrentEventImages />}
			location={event.location || "Location to be announced"}
			startTime={event.startTime}
			title={`${event.title} ongoing now!`}
		/>
	);
}
