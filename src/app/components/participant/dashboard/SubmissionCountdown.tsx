"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/app/components/ui/skeleton";
import { countdownParts, formatDashboardDate } from "@/lib/participant-events";
import { range } from "@/lib/utils";

// Ticks every second, unlike the shared useCurrentTime, so the seconds tile stays live.
function useSecondTick() {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const interval = window.setInterval(() => setNow(new Date()), 1000);
		return () => window.clearInterval(interval);
	}, []);
	return now;
}

export function SubmissionCountdown({
	deadline,
	startDate
}: {
	deadline: Date | null;
	startDate: Date | null;
}) {
	const now = useSecondTick();
	const beforeStart = !!startDate && now < startDate;
	const target = beforeStart ? startDate : deadline;
	const expired = !!target && now >= target;
	const parts = target ? countdownParts(target, now) : null;
	return (
		<section
			aria-labelledby="countdown-title"
			className="flex min-w-0 flex-col gap-4"
		>
			<div className="flex flex-col gap-1">
				<h2 className="font-medium text-xl" id="countdown-title">
					{expired
						? "Submissions closed"
						: `Time until submission ${beforeStart ? "opens" : "closes"}`}
				</h2>
				<p className="text-grey-600 text-sm/5">
					{target
						? `Submissions ${beforeStart ? "open" : "close"} on ${formatDashboardDate(target, true)}`
						: "The submission deadline will be announced soon."}
				</p>
			</div>
			{parts && (
				// The server renders a few seconds earlier than hydration, so the
				// ticking values can't match.
				<div
					aria-label={
						expired
							? "Submissions closed"
							: `${parts[0]} days, ${parts[1]} hours, ${parts[2]} minutes, ${parts[3]} seconds remaining`
					}
					className="flex justify-between gap-1 px-2 py-3 tabular-nums"
					role="timer"
					suppressHydrationWarning
				>
					{parts.map((value, index) => (
						<div
							className="flex min-w-0 flex-1 items-start justify-between gap-1"
							key={["Days", "Hours", "Minutes", "Seconds"][index]}
						>
							<div className="flex min-w-0 flex-1 flex-col items-center">
								<span
									className="text-[32px]/11 sm:text-4xl/11"
									suppressHydrationWarning
								>
									{String(value).padStart(2, "0")}
								</span>
								<span className="font-medium text-[11px]/4 uppercase">
									{["Days", "Hours", "Minutes", "Seconds"][index]}
								</span>
							</div>
							{index < 3 && (
								<span aria-hidden className="text-[32px]/11">
									:
								</span>
							)}
						</div>
					))}
				</div>
			)}
		</section>
	);
}

export function SubmissionCountdownSkeleton() {
	return (
		<div className="flex min-w-0 flex-col gap-4">
			<div className="flex flex-col gap-1">
				<Skeleton className="my-1 h-5 w-3/4" />
				<Skeleton className="my-1 h-3 w-1/2" />
			</div>
			<div className="flex justify-between gap-4 px-2 py-3">
				{range(4).map((index) => (
					<div className="flex flex-1 flex-col items-center gap-1" key={index}>
						<Skeleton className="my-0.5 h-9 w-12" />
						<Skeleton className="my-0.5 h-3 w-10" />
					</div>
				))}
			</div>
		</div>
	);
}
