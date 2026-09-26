import type { CSSProperties } from "react";
import { twMerge } from "tailwind-merge";
import { api } from "@/trpc/server";

function restrictionToString(restriction: string) {
	switch (restriction) {
		case "halal":
			return "Halal";
		case "vegetarian":
			return "Vegetarian";
		case "gluten_free":
			return "Gluten Free";
		case "vegan":
			return "Vegan";
		case "other":
			return "Other";
		default:
			return "";
	}
}

export default async function MealAnalytics() {
	const total = await api.events.getMealAttendanceCount();
	const { counts, overlaps } = await api.users.getDietaryAnalytics();

	// Text values for the grid
	const gridValues: string[][] = [];
	// Push row of names
	gridValues.push(["", ...Object.keys(counts).map(restrictionToString)]);
	// Push row for each restriction
	for (const [name, overlapCounts] of Object.entries(overlaps)) {
		gridValues.push([
			restrictionToString(name),
			...Object.values(overlapCounts).map(String)
		]);
	}

	return (
		<div className="flex flex-col gap-4">
			<h1 className="font-medium text-[22px] leading-7">Meal Analytics</h1>
			<div>
				<div className="flex max-w-[100vw] flex-row flex-wrap gap-4">
					<div className="rounded-[12px] border border-grey300 p-4">
						<p className="font-regular text-[32px] leading-10">{total}</p>
						<p className="whitespace-nowrap font-medium text-[14px] leading-5">
							Meal tickets scanned
						</p>
					</div>
					{Object.entries(counts).map(([name, count]) => {
						return (
							<div
								className="rounded-[12px] border border-grey300 p-4"
								key={name}
							>
								<p className="font-regular text-[32px] leading-10">{count}</p>
								<p className="whitespace-nowrap font-medium text-[14px] leading-5">
									{restrictionToString(name)}
								</p>
							</div>
						);
					})}
				</div>
				{/* Cannot use tailwind for grid because we cannot have dynamic values in it */}
				<div
					className="grid max-w-175 grid-cols-[repeat(var(--analytics-columns),minmax(0,1fr))] overflow-auto p-6"
					style={
						{
							"--analytics-columns": String(Object.keys(counts).length + 1)
						} as CSSProperties
					}
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
								key={`${gridValues[0]?.[secondIndex] ?? ""}${row[secondIndex] ?? ""}`}
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
