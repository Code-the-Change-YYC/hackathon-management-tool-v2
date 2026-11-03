import Banner from "@/app/components/Banner";
import CheckInImages from "./CheckInImages";

export function CheckInBanner() {
	return (
		<Banner
			colour="purple"
			description="Stop by the check-in desk when you arrive so we know you're here. Once you're checked in, you're all set for the event."
			image={<CheckInImages />}
			title="Check in to the hackathon"
		/>
	);
}
