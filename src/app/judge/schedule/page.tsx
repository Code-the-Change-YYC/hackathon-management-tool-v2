import RoomTimeSlotsGrid from "../../components/judges/RoomTimeSlotsGrid";

export default function JudgeSchedulePage() {
	return (
		<div>
			<p className="mb-2 font-medium text-dashboard-grey text-xs uppercase tracking-wide">
				Judging Schedule
			</p>
			<div className="rounded-2xl border-2 border-awesomer-purple bg-white p-6 shadow-md sm:p-8">
				<RoomTimeSlotsGrid />
			</div>
		</div>
	);
}
