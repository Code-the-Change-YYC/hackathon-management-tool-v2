import { twMerge } from "tailwind-merge";

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

export default function MealAnalytics() {
	const total: number = 0;
	const counts: Map<string, number> = new Map<string, number>();
	const overlaps: Map<string, Map<string, number>> = new Map<
		string,
		Map<string, number>
	>();

	// Text values for the grid
	const gridValues: string[][] = [];
	// Push row of names
	gridValues.push(["", ...Array.from(counts.keys())]);
	// Push row for each restriction
	for (const [name, overlapCounts] of overlaps.entries()) {
		gridValues.push([name, ...Array.from(overlapCounts.values()).map(String)]);
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
					{Array.from(counts.entries()).map(([name, count]) => {
						return <RestrictionCard count={count} key={name} name={name} />;
					})}
				</div>
				{/* Cannot use tailwind for grid because we cannot have dynamic values in it */}
				<div
					className="max-w-175 overflow-auto p-6 first:justify-self-end"
					style={{
						display: "grid",
						gridTemplateColumns: `repeat(${counts.size + 1}, 1fr)`
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
