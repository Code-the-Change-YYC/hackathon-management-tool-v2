import { twMerge } from "tailwind-merge";
import { api } from "@/trpc/react";

function RestrictionCard({ name, count }: { name: string; count: number }) {
	return (
		<div className="rounded-[12px] border border-grey300 p-4">
			<p className="font-regular text-[32px] leading-10">{count}</p>
			<p className="whitespace-nowrap font-medulm text-[14px] leading-5">
				{name}
			</p>
		</div>
	);
}

export default async function MealAnalytics() {
	const getMealAttendanceCount =
		await api.events.getMealAttendanceCount.useQuery();
	const getDietaryAnalytics = await api.users.getDietaryAnalytics.useQuery();

	if (!getMealAttendanceCount.data || !getDietaryAnalytics.data) {
		return <div className="text-medium-grey text-sm">No attendees yet.</div>;
	}
	const total: number = getMealAttendanceCount.data;
	const counts: Record<string, number> = getDietaryAnalytics.data.counts;
	const overlaps: Record<string, Record<string, number>> = getDietaryAnalytics
		.data.overlaps;

	// Text values for the grid
	const gridValues: string[][] = [];
	// Push row of names
	gridValues.push(["", ...Object.keys(counts)]);
	// Push row for each restriction
	for (const [name, overlapCounts] of Object.entries(overlaps)) {
		gridValues.push([name, ...Object.values(overlapCounts).map(String)]);
	}

	return (
		<div className="flex flex-col gap-4">
			<h1 className="font-medium text-[22px] leading-7">Meal Analytics</h1>
			<div>
				{/* Dropbox Here */}
				<div className="flex max-w-[100vw] flex-row flex-wrap gap-4">
					<RestrictionCard
						count={total}
						key={"Meal tickets scanned"}
						name={"Meal tickets scanned"}
					/>
					{Object.entries(counts).map(([name, count]) => {
						return <RestrictionCard count={count} key={name} name={name} />;
					})}
				</div>
				{/* Cannot use tailwind for grid because we cannot have dynamic values in it */}
				<div
					className="max-w-175 overflow-auto p-6 first:justify-self-end"
					style={{
						display: "grid",
						gridTemplateColumns: `repeat(${counts.size ?? 0 + 1}, 1fr)`
					}}
				>
					{gridValues.map((row, firstIndex) => {
						return row.map((text, secondIndex) => (
							<p
								className={twMerge(
									"p-2 text-[14px] leading-5",
									(firstIndex === 0 || secondIndex === 0) &&
										"font-semibold text-grey800",
									secondIndex === 0 ? "justify-self-end" : "justify-self-center"
								)}
								key={row[0] + text}
							>
								{text}
							</p>
						));
					})}
				</div>
			</div>
		</div>
	);
}
