"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import {
	eachCalgaryDay,
	formatDateKey,
	formatFullDate,
	formatMonthDay
} from "@/lib/datetime";
import type { Participant } from "./types";

const chartConfig = {
	users: {
		label: "Users",
		color: "var(--primary)"
	}
} satisfies ChartConfig;

type RegistrationPoint = {
	date: number;
	users: number;
};

// One point per Calgary day, holding the running total of sign-ups.
function getRegistrationPoints(participants: Participant[]) {
	const signedUpAt = participants
		.map((participant) => participant.signedUpAt.getTime())
		.sort((a, b) => a - b);
	const first = signedUpAt[0];
	const last = signedUpAt.at(-1);

	if (first === undefined || last === undefined) {
		return [];
	}

	const registrationsByDay = new Map<string, number>();
	for (const time of signedUpAt) {
		const key = formatDateKey(time);
		registrationsByDay.set(key, (registrationsByDay.get(key) ?? 0) + 1);
	}

	const days = eachCalgaryDay(first, last);
	let total = 0;

	return days.map<RegistrationPoint>((day) => {
		total += registrationsByDay.get(formatDateKey(day)) ?? 0;
		return { date: day.getTime(), users: total };
	});
}

type RegistrationsChartCardProps = {
	participants: Participant[];
};

export function RegistrationsChartCard({
	participants
}: RegistrationsChartCardProps) {
	const points = useMemo(
		() => getRegistrationPoints(participants),
		[participants]
	);
	const firstPoint = points[0];

	return (
		<Card>
			<CardHeader>
				<h2 className="font-medium text-xl">User Registrations</h2>
				<CardDescription>
					{firstPoint
						? `${participants.length.toLocaleString()} users have signed up since ${formatFullDate(firstPoint.date)}`
						: "No users have signed up yet"}
				</CardDescription>
			</CardHeader>
			{firstPoint && (
				<CardContent>
					<ChartContainer
						className="aspect-auto h-64 w-full"
						config={chartConfig}
					>
						<AreaChart data={points} margin={{ left: 0, right: 12 }}>
							<CartesianGrid vertical={false} />
							<XAxis
								axisLine={false}
								dataKey="date"
								minTickGap={32}
								tickFormatter={(value: number) => formatMonthDay(value)}
								tickLine={false}
								tickMargin={8}
							/>
							<YAxis
								allowDecimals={false}
								axisLine={false}
								tickLine={false}
								tickMargin={8}
								width={32}
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										indicator="line"
										labelFormatter={(_, payload) =>
											formatFullDate(payload[0]?.payload.date)
										}
									/>
								}
								cursor={false}
							/>
							<Area
								dataKey="users"
								fill="var(--accent)"
								fillOpacity={1}
								stroke="var(--color-users)"
								strokeWidth={2}
								type="monotone"
							/>
						</AreaChart>
					</ChartContainer>
				</CardContent>
			)}
		</Card>
	);
}
