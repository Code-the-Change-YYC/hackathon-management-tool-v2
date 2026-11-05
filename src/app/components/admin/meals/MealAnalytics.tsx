"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader
} from "@/app/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent
} from "@/app/components/ui/chart";
import { Skeleton } from "@/app/components/ui/skeleton";
import { formatLongDate, formatTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import {
	DIETARY_RESTRICTION_LABELS,
	DIETARY_RESTRICTIONS
} from "@/lib/validation/signup";
import type { RouterOutputs } from "@/trpc/react";
import { mealRoundCounts } from "./meal-round-counts";

type DietaryAnalytics = RouterOutputs["users"]["getDietaryAnalytics"];
type MealWithCheckIns = RouterOutputs["meals"]["getMealCheckIns"][number];

const BAR_ROW_HEIGHT = 40;
const MAX_TICK_LENGTH = 22;

const dietaryChartConfig = {
	count: { label: "Participants", color: "var(--primary)" }
} satisfies ChartConfig;

function toPercent(value: number, total: number) {
	return total === 0 ? 0 : Math.round((value / total) * 100);
}

function truncateTick(value: string) {
	return value.length > MAX_TICK_LENGTH
		? `${value.slice(0, MAX_TICK_LENGTH - 1)}…`
		: value;
}

function CheckInsPerMealCard({
	meals,
	now,
	participantCount
}: {
	meals: MealWithCheckIns[];
	now: Date;
	participantCount: number;
}) {
	const points = meals
		.filter((meal) => meal.startTime <= now)
		.map((meal) => {
			const rounds = mealRoundCounts(meal.attendance);

			return {
				id: meal.id,
				title: meal.title,
				startTime: meal.startTime,
				rounds,

				total: meal.attendance.length,
				turnout: toPercent(rounds[0] ?? 0, participantCount),
				...Object.fromEntries(
					(rounds.length ? rounds : [0]).map((count, index) => [
						`round${index + 1}`,
						count
					])
				)
			};
		});
	const roundCount = Math.max(1, ...points.map((point) => point.rounds.length));
	const roundKeys = Array.from(
		{ length: roundCount },
		(_, index) => `round${index + 1}`
	);
	const checkInsChartConfig: ChartConfig = Object.fromEntries(
		roundKeys.map((key, index) => [
			key,
			{
				label: `Round ${index + 1}`,
				color: `var(--chart-${(index % 5) + 1})`
			}
		])
	);

	return (
		<Card>
			<CardHeader>
				<h3 className="font-medium text-lg">Check-ins per Meal</h3>
				<CardDescription>
					{points.length > 0
						? `Meals that have started, out of ${participantCount.toLocaleString()} registered participants`
						: "No meals have started yet"}
				</CardDescription>
			</CardHeader>
			{points.length > 0 && (
				<CardContent>
					<div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
						{roundKeys.map((key, index) => (
							<span className="flex items-center gap-1.5" key={key}>
								<span
									className="size-2.5 rounded-sm"
									style={{ backgroundColor: `var(--chart-${(index % 5) + 1})` }}
								/>
								Round {index + 1}
							</span>
						))}
					</div>
					<ChartContainer
						className="aspect-auto w-full"
						config={checkInsChartConfig}
						style={{ height: points.length * BAR_ROW_HEIGHT + 8 }}
					>
						<BarChart
							data={points}
							layout="vertical"
							margin={{ left: 0, right: 64, top: 0, bottom: 0 }}
						>
							<XAxis allowDecimals={false} dataKey="total" hide type="number" />
							<YAxis
								axisLine={false}
								dataKey="title"
								tickFormatter={truncateTick}
								tickLine={false}
								tickMargin={8}
								type="category"
								width="auto"
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										formatter={(value, name, item) => (
											<div className="flex flex-col gap-0.5">
												<span>
													<span className="font-medium font-mono tabular-nums">
														{name}: {Number(value).toLocaleString()}
													</span>{" "}
													scans
												</span>
												{item.dataKey === "round1" && (
													<span className="text-muted-foreground">
														{item.payload.turnout}% of participants checked in
													</span>
												)}
											</div>
										)}
										labelFormatter={(_, payload) => {
											const point = payload[0]?.payload;
											return point
												? `${point.title} · ${formatLongDate(point.startTime)}, ${formatTime(point.startTime)}`
												: null;
										}}
									/>
								}
								cursor={false}
							/>
							{roundKeys.map((key, index) => (
								<Bar
									barSize={20}
									dataKey={key}
									fill={`var(--color-${key})`}
									key={key}
									name={`Round ${index + 1}`}
									stackId="scans"
								>
									{index === 0 && (
										<LabelList
											content={({ x, y, width, height, index: rowIndex }) => {
												const point = points[Number(rowIndex)];
												if (
													!point ||
													typeof x !== "number" ||
													typeof y !== "number" ||
													typeof width !== "number" ||
													typeof height !== "number"
												)
													return null;
												const pixelsPerScan = width / (point.rounds[0] || 1);
												const end = x + point.total * pixelsPerScan;
												const labels: {
													round: number;
													text: string;
													right: number;
												}[] = [];
												let scansThroughRound = 0;
												if (point.rounds.length > 1) {
													point.rounds.forEach((count, round) => {
														scansThroughRound += count;
														const text = count.toLocaleString();
														// Keep white labels entirely within their own colored segment.
														if (
															count > 1 &&
															count * pixelsPerScan >= text.length * 7 + 12
														) {
															labels.push({
																round,
																text,
																right: x + scansThroughRound * pixelsPerScan - 6
															});
														}
													});
												}
												return (
													<>
														{labels.map(({ round, text, right }) => (
															<text
																className="tabular-nums"
																dominantBaseline="middle"
																fill="white"
																key={round}
																textAnchor="end"
																x={right}
																y={y + height / 2}
															>
																{text}
															</text>
														))}
														<text
															className="tabular-nums"
															dominantBaseline="middle"
															fill="var(--foreground)"
															textAnchor="start"
															x={end + 8}
															y={y + height / 2}
														>
															{point.total.toLocaleString()}
														</text>
													</>
												);
											}}
											dataKey={key}
										/>
									)}
								</Bar>
							))}
						</BarChart>
					</ChartContainer>
				</CardContent>
			)}
		</Card>
	);
}

function DietaryRestrictionsCard({ dietary }: { dietary: DietaryAnalytics }) {
	const points = DIETARY_RESTRICTIONS.map((restriction) => {
		const count = dietary.counts[restriction];
		const percent = toPercent(count, dietary.participantCount);
		return {
			restriction,
			label: DIETARY_RESTRICTION_LABELS[restriction],
			count,
			display: `${count.toLocaleString()} (${percent}%)`
		};
	}).sort((left, right) => right.count - left.count);

	return (
		<Card>
			<CardHeader>
				<h3 className="font-medium text-lg">Dietary Restrictions</h3>
				<CardDescription>
					{`${dietary.unrestrictedCount.toLocaleString()} of ${dietary.participantCount.toLocaleString()} registered participants have none`}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer
					className="aspect-auto w-full"
					config={dietaryChartConfig}
					style={{ height: points.length * BAR_ROW_HEIGHT + 8 }}
				>
					<BarChart
						data={points}
						layout="vertical"
						margin={{ left: 0, right: 64, top: 0, bottom: 0 }}
					>
						<XAxis allowDecimals={false} dataKey="count" hide type="number" />
						<YAxis
							axisLine={false}
							dataKey="label"
							tickLine={false}
							tickMargin={8}
							type="category"
							width="auto"
						/>
						<ChartTooltip
							content={<ChartTooltipContent hideIndicator />}
							cursor={false}
						/>
						<Bar
							barSize={20}
							dataKey="count"
							fill="var(--color-count)"
							minPointSize={2}
							radius={[0, 4, 4, 0]}
						>
							<LabelList
								className="fill-foreground tabular-nums"
								dataKey="display"
								offset={8}
								position="right"
							/>
						</Bar>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

// Stronger overlaps get a stronger shade of the brand purple.
function getOverlapCellClassName(value: number, max: number) {
	if (value === 0) return "bg-muted/60 text-muted-foreground";
	const share = value / max;
	if (share <= 0.2) return "bg-primary/15";
	if (share <= 0.4) return "bg-primary/30";
	if (share <= 0.6) return "bg-primary/50";
	if (share <= 0.8) return "bg-primary/75 text-primary-foreground";
	return "bg-primary text-primary-foreground";
}

function OverlapHeatmapCard({ dietary }: { dietary: DietaryAnalytics }) {
	const rows = DIETARY_RESTRICTIONS.slice(1);
	const columns = DIETARY_RESTRICTIONS.slice(0, -1);
	const maxOverlap = Math.max(
		1,
		...rows.flatMap((row, rowIndex) =>
			columns
				.slice(0, rowIndex + 1)
				.map((column) => dietary.overlaps[row][column])
		)
	);

	return (
		<Card>
			<CardHeader>
				<h3 className="font-medium text-lg">Restriction Overlaps</h3>
				<CardDescription>
					Participants who selected both restrictions
				</CardDescription>
			</CardHeader>
			<CardContent className="max-w-full overflow-x-auto">
				<table className="border-separate border-spacing-1 text-xs">
					<caption className="sr-only">
						Participants with each pair of dietary restrictions
					</caption>
					<thead>
						<tr>
							<td />
							{columns.map((column) => (
								<th
									className="w-16 px-1 pb-1 align-bottom font-medium text-muted-foreground"
									key={column}
									scope="col"
								>
									{DIETARY_RESTRICTION_LABELS[column]}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row, rowIndex) => (
							<tr key={row}>
								<th
									className="whitespace-nowrap pr-2 text-right font-medium text-muted-foreground"
									scope="row"
								>
									{DIETARY_RESTRICTION_LABELS[row]}
								</th>
								{columns.map((column, columnIndex) => {
									if (columnIndex > rowIndex) {
										return <td key={column} />;
									}
									const value = dietary.overlaps[row][column];
									return (
										<td
											className={cn(
												"h-10 rounded-md text-center font-medium text-sm tabular-nums",
												getOverlapCellClassName(value, maxOverlap)
											)}
											key={column}
											title={`${DIETARY_RESTRICTION_LABELS[row]} + ${DIETARY_RESTRICTION_LABELS[column]}: ${value}`}
										>
											{value}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</CardContent>
		</Card>
	);
}

export function MealAnalytics({
	meals,
	now,
	dietary
}: {
	meals: MealWithCheckIns[];
	now: Date;
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
			<CheckInsPerMealCard
				meals={meals}
				now={now}
				participantCount={dietary.participantCount}
			/>
			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<DietaryRestrictionsCard dietary={dietary} />
				<OverlapHeatmapCard dietary={dietary} />
			</div>
		</section>
	);
}

function ChartCardSkeleton({ className }: { className?: string }) {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="my-1 h-5 w-40" />
				<Skeleton className="my-0.5 h-4 w-64 max-w-full" />
			</CardHeader>
			<CardContent>
				<Skeleton className={cn("w-full", className)} />
			</CardContent>
		</Card>
	);
}

export function MealAnalyticsSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<h2 className="font-medium text-xl">Meal Analytics</h2>
			<ChartCardSkeleton className="h-40" />
			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<ChartCardSkeleton className="h-72" />
				<ChartCardSkeleton className="h-72" />
			</div>
		</div>
	);
}
