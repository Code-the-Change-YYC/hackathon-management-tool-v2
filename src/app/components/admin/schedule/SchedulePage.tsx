import FullSchedule from "./FullSchedule";

export default function SchedulePage() {
	return (
		<div className="flex flex-col gap-[24px] p-[24px]">
			<div className="flex flex-col">
				<h1 className="font-semibold text-[32px] leading-[40px]">Schedule</h1>
				<p className="font-regular text-[16px] text-grey600 leading-[24px]">
					View all hackathon events and activities
				</p>
			</div>
			<FullSchedule />
		</div>
	);
}
