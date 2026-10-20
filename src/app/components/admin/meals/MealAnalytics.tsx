import { Skeleton } from "@/app/components/ui/skeleton";
import { cn, range } from "@/lib/utils";
import {
	DIETARY_RESTRICTION_LABELS,
	DIETARY_RESTRICTIONS
} from "@/lib/validation/signup";
import type { RouterOutputs } from "@/trpc/react";

type DietaryAnalytics = RouterOutputs["users"]["getDietaryAnalytics"];

function StatTile({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-[12px] border p-4">
			<p className="font-normal text-[32px] leading-10">{value}</p>
			<p className="whitespace-nowrap font-medium text-[14px] leading-5">
				{label}
			</p>
		</div>
	);
}

export function MealAnalytics({
	ticketsScanned,
	dietary
}: {
	ticketsScanned: number;
	dietary: DietaryAnalytics;
}) {
	return (
		<section
			aria-labelledby="meal-analytics-title"
			className="flex flex-col gap-4"
		>
			<h2 className="font-medium text-xl" id="meal-analytics-title">
				Meal Analytics
			</h2>
			<div className="flex flex-wrap gap-4">
				<StatTile label="Meal tickets scanned" value={ticketsScanned} />
				{DIETARY_RESTRICTIONS.map((restriction) => (
					<StatTile
						key={restriction}
						label={DIETARY_RESTRICTION_LABELS[restriction]}
						value={dietary.counts[restriction]}
					/>
				))}
			</div>
			<div className="max-w-full overflow-x-auto">
				<table className="text-[14px] leading-5">
					<caption className="sr-only">
						Participants with each pair of dietary restrictions
					</caption>
					<thead>
						<tr>
							<td />
							{DIETARY_RESTRICTIONS.map((restriction) => (
								<th className="p-2 font-semibold" key={restriction} scope="col">
									{DIETARY_RESTRICTION_LABELS[restriction]}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{DIETARY_RESTRICTIONS.map((row) => (
							<tr key={row}>
								<th className="p-2 text-right font-semibold" scope="row">
									{DIETARY_RESTRICTION_LABELS[row]}
								</th>
								{DIETARY_RESTRICTIONS.map((column) => (
									<td className="p-2 text-center" key={column}>
										{dietary.overlaps[row][column]}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}

export function MealAnalyticsSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<h2 className="font-medium text-xl">Meal Analytics</h2>
			<div className="flex flex-wrap gap-4">
				{range(DIETARY_RESTRICTIONS.length + 1).map((index) => (
					<div
						className={cn(
							"flex flex-col gap-1 rounded-[12px] border p-4",
							index === 0 ? "w-44" : "w-28"
						)}
						key={index}
					>
						<Skeleton className="my-1 h-8 w-10" />
						<Skeleton className="my-1 h-3 w-full" />
					</div>
				))}
			</div>
			<Skeleton className="h-72 w-full max-w-200" />
		</div>
	);
}
