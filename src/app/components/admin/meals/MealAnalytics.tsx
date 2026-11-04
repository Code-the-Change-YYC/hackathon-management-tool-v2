"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/app/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent
} from "@/app/components/ui/chart";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/app/components/ui/select";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/app/components/ui/table";
import { formatShortDate } from "@/lib/datetime";
import {
	DIETARY_RESTRICTION_LABELS,
	DIETARY_RESTRICTIONS
} from "@/lib/validation/signup";
import { api, type RouterOutputs } from "@/trpc/react";

type Analytics = RouterOutputs["meals"]["getAttendanceAnalytics"];
const ENTIRE_EVENT = "entire-event";
const chartConfig = {
	count: { label: "Attendees", color: "var(--primary)" }
} satisfies ChartConfig;

export function MealAnalytics({ initialData }: { initialData: Analytics }) {
	const [selectedId, setSelectedId] = useState(ENTIRE_EVENT);
	const { data: analytics } = api.meals.getAttendanceAnalytics.useQuery(
		undefined,
		{ initialData, refetchInterval: 15_000, refetchOnMount: "always" }
	);
	const selectedMeal = analytics.meals.find((meal) => meal.id === selectedId);
	const isEntireEvent = !selectedMeal;
	const scans = selectedMeal?.scans ?? analytics.overall.scans;
	const restrictions =
		selectedMeal?.restrictions ?? analytics.overall.restrictions;
	const label = selectedMeal?.title ?? "Entire event";
	const chartData = DIETARY_RESTRICTIONS.map((restriction) => ({
		label: DIETARY_RESTRICTION_LABELS[restriction],
		count: restrictions[restriction]
	}));

	return (
		<section
			aria-labelledby="meal-analytics-title"
			className="flex flex-col gap-4"
		>
			<h2 className="font-medium text-xl" id="meal-analytics-title">
				Meal Analytics
			</h2>
			<Card>
				<CardHeader className="flex flex-wrap items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<CardTitle>{label}</CardTitle>
						<CardDescription>
							{isEntireEvent
								? "Scans include every meal visit. Dietary counts include each attendee only once across the event."
								: "Scans and dietary counts for this meal. Restrictions reflect attendees' current saved preferences."}
						</CardDescription>
					</div>
					<div className="flex flex-col gap-1">
						<label className="font-medium text-sm" htmlFor="analytics-meal">
							Meal
						</label>
						<Select
							items={[
								{ value: ENTIRE_EVENT, label: "Entire event" },
								...analytics.meals.map((meal) => ({
									value: meal.id,
									label: `${meal.title} · ${formatShortDate(meal.startTime)}`
								}))
							]}
							onValueChange={(value) => setSelectedId(value ?? ENTIRE_EVENT)}
							value={selectedMeal?.id ?? ENTIRE_EVENT}
						>
							<SelectTrigger className="w-full max-w-80" id="analytics-meal">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value={ENTIRE_EVENT}>Entire event</SelectItem>
									{analytics.meals.map((meal) => (
										<SelectItem key={meal.id} value={meal.id}>
											{meal.title} · {formatShortDate(meal.startTime)}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
				<CardContent className="flex flex-col gap-6">
					{isEntireEvent && analytics.meals.length === 0 && (
						<p className="text-muted-foreground text-sm">
							No meals have been scheduled yet.
						</p>
					)}
					{isEntireEvent && (
						<p className="text-muted-foreground text-sm">
							{analytics.overall.uniqueAttendees} unique meal attendees
						</p>
					)}
					<Table className="min-w-200">
						<TableCaption className="sr-only">
							Scans and dietary restrictions for {label}
						</TableCaption>
						<TableHeader>
							<TableRow>
								<TableHead>Meal</TableHead>
								<TableHead className="text-right">Scanned</TableHead>
								{DIETARY_RESTRICTIONS.map((restriction) => (
									<TableHead className="text-right" key={restriction}>
										{DIETARY_RESTRICTION_LABELS[restriction]}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell className="whitespace-normal font-medium">
									{label}
									{selectedMeal && (
										<span className="block text-muted-foreground text-xs">
											{formatShortDate(selectedMeal.startTime)}
										</span>
									)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{scans}
								</TableCell>
								{DIETARY_RESTRICTIONS.map((restriction) => (
									<TableCell
										className="text-right tabular-nums"
										key={restriction}
									>
										{restrictions[restriction]}
									</TableCell>
								))}
							</TableRow>
						</TableBody>
					</Table>
					<div>
						<h3 className="mb-3 font-medium">Dietary restrictions</h3>
						<ChartContainer className="h-72 w-full" config={chartConfig}>
							<BarChart
								accessibilityLayer
								data={chartData}
								layout="vertical"
								margin={{ left: 8, right: 16 }}
							>
								<CartesianGrid horizontal={false} />
								<XAxis
									allowDecimals={false}
									axisLine={false}
									tickLine={false}
									type="number"
								/>
								<YAxis
									axisLine={false}
									dataKey="label"
									tickLine={false}
									type="category"
									width={100}
								/>
								<ChartTooltip
									content={<ChartTooltipContent hideLabel />}
									cursor={false}
								/>
								<Bar dataKey="count" fill="var(--color-count)" radius={4} />
							</BarChart>
						</ChartContainer>
					</div>
				</CardContent>
			</Card>
		</section>
	);
}

export function MealAnalyticsSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<h2 className="font-medium text-xl">Meal Analytics</h2>
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<Skeleton className="h-16 w-56" />
					<Skeleton className="h-48 w-full" />
				</CardContent>
			</Card>
		</div>
	);
}
