"use client";

import { CheckLine, CloseLine, TimeLine } from "@mingcute/react";
import type { ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader
} from "@/app/components/ui/card";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/app/components/ui/select";
import type { PrescreenStatus } from "@/types/types";
import { MAX_PRESCREEN_BATCHES, splitIntoBatches, type Team } from "./types";

const STATUSES: {
	status: PrescreenStatus;
	label: string;
	icon: ReactNode;
	barClassName: string;
}[] = [
	{
		status: "pending",
		label: "Not pre-screened",
		icon: <TimeLine className="size-4" />,
		barClassName: "bg-muted"
	},
	{
		status: "failed",
		label: "Failed",
		icon: <CloseLine className="size-4" color="var(--color-red-600)" />,
		barClassName: "bg-red-600"
	},
	{
		status: "passed",
		label: "Passed",
		icon: <CheckLine className="size-4" color="var(--color-primary)" />,
		barClassName: "bg-primary"
	}
];

function countPending(teams: Team[]) {
	return teams.filter((team) => team.prescreen === "pending").length;
}

type PrescreeningCardProps = {
	teams: Team[];
	batchCount: number;
	onBatchCountChange: (count: number) => void;
	onStart: (batch: number) => void;
};

// Admins split the teams into batches and agree in person on who takes which.
export function PrescreeningCard({
	teams,
	batchCount,
	onBatchCountChange,
	onStart
}: PrescreeningCardProps) {
	const counts = STATUSES.map((entry) => ({
		...entry,
		count: teams.filter((team) => team.prescreen === entry.status).length
	}));
	const pendingCount = counts[0]?.count ?? 0;
	const screenedCount = teams.length - pendingCount;
	const batchOptions = Array.from(
		{ length: Math.min(MAX_PRESCREEN_BATCHES, Math.max(teams.length, 1)) },
		(_, index) => ({
			value: index + 1,
			label: index === 0 ? "1 batch" : `${index + 1} batches`
		})
	);
	const batches = splitIntoBatches(teams, batchCount);

	return (
		<Card>
			<CardHeader className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex min-w-0 flex-col gap-1">
					<h2 className="font-medium text-xl">Pre-screening</h2>
					<CardDescription>
						{teams.length === 0
							? "No teams have registered yet"
							: `${screenedCount.toLocaleString()} of ${teams.length.toLocaleString()} teams pre-screened`}
					</CardDescription>
				</div>
				<div className="flex flex-wrap gap-2">
					<Select
						disabled={teams.length < 2}
						items={batchOptions}
						onValueChange={(value) => value && onBatchCountChange(value)}
						value={batchCount}
					>
						<SelectTrigger aria-label="Number of batches">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{batchOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
					{batchCount === 1 ? (
						<Button disabled={teams.length === 0} onClick={() => onStart(1)}>
							{pendingCount > 0
								? "Start pre-screening"
								: "Review pre-screening"}
						</Button>
					) : null}
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-5">
				<div aria-hidden className="flex h-2 gap-0.5">
					{teams.length === 0 ? (
						<div className="grow rounded-full bg-muted" />
					) : (
						counts
							.filter((entry) => entry.count > 0)
							.map((entry) => (
								<div
									className={`rounded-full ${entry.barClassName}`}
									key={entry.status}
									style={{ flexGrow: entry.count }}
								/>
							))
					)}
				</div>
				<dl className="grid grid-cols-3 gap-4">
					{counts.map((entry) => (
						<div
							className="flex flex-col justify-between gap-1"
							key={entry.status}
						>
							<dt className="flex items-start gap-1.5 text-muted-foreground [&_svg]:mt-0.5 [&_svg]:shrink-0">
								{entry.icon}
								{entry.label}
							</dt>
							<dd className="font-semibold text-2xl">
								{entry.count.toLocaleString()}
							</dd>
						</div>
					))}
				</dl>
				{batchCount > 1 ? (
					<ul className="flex flex-col divide-y rounded-xl border">
						{batches.map((batch, index) => {
							const number = index + 1;
							const left = countPending(batch);
							return (
								<li
									className="flex flex-wrap items-center justify-between gap-3 p-3"
									key={number}
								>
									<div className="flex min-w-0 flex-col gap-0.5">
										<span className="font-medium">Batch {number}</span>
										<span className="text-muted-foreground text-sm">
											{batch.length === 0
												? "No teams"
												: `${batch[0]?.name} to ${batch.at(-1)?.name} · ${left === 0 ? "all done" : `${left.toLocaleString()} of ${batch.length.toLocaleString()} left`}`}
										</span>
									</div>
									<Button
										aria-label={`${left > 0 ? "Start" : "Review"} batch ${number}`}
										disabled={batch.length === 0}
										onClick={() => onStart(number)}
										size="sm"
										variant={left > 0 ? "default" : "outline"}
									>
										{left > 0 ? "Start" : "Review"}
									</Button>
								</li>
							);
						})}
					</ul>
				) : null}
			</CardContent>
		</Card>
	);
}
