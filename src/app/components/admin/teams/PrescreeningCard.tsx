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
import type { PrescreenStatus } from "@/types/types";
import type { Team } from "./types";

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
		icon: <CheckLine className="size-4" color="var(--color-green-700)" />,
		barClassName: "bg-green-700"
	}
];

type PrescreeningCardProps = {
	teams: Team[];
	onStart: () => void;
};

export function PrescreeningCard({ teams, onStart }: PrescreeningCardProps) {
	const counts = STATUSES.map((entry) => ({
		...entry,
		count: teams.filter((team) => team.prescreen === entry.status).length
	}));
	const pendingCount = counts[0]?.count ?? 0;
	const screenedCount = teams.length - pendingCount;

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
				<Button disabled={teams.length === 0} onClick={onStart}>
					{pendingCount > 0 ? "Start pre-screening" : "Review pre-screening"}
				</Button>
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
			</CardContent>
		</Card>
	);
}
