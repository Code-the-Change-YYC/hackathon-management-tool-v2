import ScanMealTicketsImages from "@/app/components/admin/meals/ScanMealTicketsImages";
import Banner from "@/app/components/Banner";

export function CheckInBanner() {
	return (
		<Banner
			colour="purple"
			description="Visit the check-in desk to unlock your meal tickets. Once you're checked in, your digital ticket appears on the Meals page and you'll get your physical tickets."
			image={<ScanMealTicketsImages />}
			title="Check in to get your meal tickets"
		/>
	);
}
