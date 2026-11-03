"use client";

import { ArrowLeftLine, RightLine } from "@mingcute/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button, buttonVariants } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { formatPlace, getBallotPlaces, getBallotPoints } from "@/lib/judging";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import {
	getBallotPlace,
	getTeamCode,
	type JudgeAssignment
} from "../judgePortal";

const rowClass =
	"focus-visible:-outline-offset-2 flex min-h-18 w-full cursor-pointer items-center gap-4 px-4 py-3 text-left transition hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none sm:px-6";

// Each place's finalist, from 1st; null while that place is open.
function getSavedPicks(finalists: JudgeAssignment[], places: number) {
	return Array.from(
		{ length: places },
		(_, index) =>
			finalists.find((finalist) => getBallotPlace(finalist) === index + 1)
				?.id ?? null
	);
}

function PickStep({
	finalists,
	picks,
	disabled,
	onToggle
}: {
	finalists: JudgeAssignment[];
	picks: (string | null)[];
	disabled: boolean;
	onToggle: (assignmentId: string) => void;
}) {
	return (
		<section aria-labelledby="rank-heading" className="flex flex-col gap-8">
			<div className="flex flex-col gap-3">
				<h2 className="m-0 font-semibold text-3xl" id="rank-heading">
					Rank your top {picks.length}
				</h2>
				<p className="m-0 text-lg text-muted-foreground leading-relaxed">
					Tap teams in order, starting with your 1st place. Tap a team again to
					clear it.
				</p>
			</div>
			<Card className="py-0">
				<ul className="m-0 list-none divide-y divide-grey-200 p-0">
					{finalists.map((finalist) => {
						const index = picks.indexOf(finalist.id);
						const place = index === -1 ? null : index + 1;
						return (
							<li key={finalist.id}>
								<button
									aria-label={
										place
											? `${finalist.team.name}, ${formatPlace(place)} place`
											: finalist.team.name
									}
									aria-pressed={place !== null}
									className={rowClass}
									disabled={disabled}
									onClick={() => onToggle(finalist.id)}
									type="button"
								>
									<span
										aria-hidden
										className={cn(
											"flex size-11 shrink-0 items-center justify-center rounded-full border-2 font-semibold text-sm transition-colors",
											place
												? "border-primary bg-primary text-primary-foreground"
												: "border-grey-300 border-dashed"
										)}
									>
										{place ? formatPlace(place) : null}
									</span>
									<span className="flex min-w-0 flex-1 flex-col">
										<span className="wrap-break-word font-medium text-base sm:text-lg">
											{finalist.team.name}
										</span>
										<span className="text-muted-foreground text-sm tracking-wider">
											{getTeamCode(finalist)}
										</span>
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			</Card>
		</section>
	);
}

function ReviewStep({
	finalists,
	picks,
	disabled,
	onEdit
}: {
	finalists: JudgeAssignment[];
	picks: (string | null)[];
	disabled: boolean;
	onEdit: () => void;
}) {
	return (
		<section
			aria-labelledby="rank-review-heading"
			className="flex flex-col gap-8"
		>
			<div className="flex flex-col gap-3">
				<h2 className="m-0 font-semibold text-3xl" id="rank-review-heading">
					Review your ranking
				</h2>
				<p className="m-0 text-muted-foreground">
					Select a place to change your ranking.
				</p>
			</div>
			<Card className="py-0">
				<ul className="m-0 list-none divide-y divide-grey-200 p-0">
					{picks.map((assignmentId, index) => {
						const place = index + 1;
						const finalist = finalists.find(({ id }) => id === assignmentId);
						return (
							<li key={place}>
								<button
									className={rowClass}
									disabled={disabled}
									onClick={onEdit}
									type="button"
								>
									<span className="w-10 shrink-0 font-semibold text-lg text-primary">
										{formatPlace(place)}
									</span>
									<span className="wrap-break-word min-w-0 flex-1 font-medium">
										{finalist?.team.name}
									</span>
									<span className="shrink-0 text-muted-foreground text-sm tabular-nums">
										{getBallotPoints(place) === 1
											? "1 pt"
											: `${getBallotPoints(place)} pts`}
									</span>
									<RightLine
										aria-hidden
										className="size-5 text-muted-foreground"
									/>
								</button>
							</li>
						);
					})}
				</ul>
			</Card>
		</section>
	);
}

export function RankFlow({
	finalists,
	roundName
}: {
	finalists: JudgeAssignment[];
	roundName: string;
}) {
	const router = useRouter();
	const places = getBallotPlaces(finalists.length);
	const savedPicks = getSavedPicks(finalists, places);
	const submitted = savedPicks.every(Boolean);
	const [picks, setPicks] = useState(savedPicks);
	// A submitted ranking opens on review, like a scored team.
	const [reviewing, setReviewing] = useState(submitted);
	const [saving, setSaving] = useState(false);
	const submit = api.finalBallots.submit.useMutation();
	const stepContainer = useRef<HTMLDivElement>(null);
	const shownStep = useRef(reviewing);
	const complete = picks.every(Boolean);

	// Move focus to each new step so keyboard and screen reader users follow along.
	useEffect(() => {
		if (shownStep.current === reviewing) return;
		shownStep.current = reviewing;
		stepContainer.current?.focus();
	}, [reviewing]);

	function toggle(assignmentId: string) {
		setPicks((current) => {
			const index = current.indexOf(assignmentId);
			const next = current.slice();
			if (index !== -1) next[index] = null;
			else {
				const open = next.indexOf(null);
				if (open === -1) return current;
				next[open] = assignmentId;
			}
			return next;
		});
	}

	async function save() {
		if (!complete || saving) return;
		setSaving(true);
		try {
			await submit.mutateAsync({ assignmentIds: picks as string[] });
		} catch {
			setSaving(false);
			return;
		}
		toast.success(submitted ? "Ranking updated" : "Ranking submitted");
		// Stay in the saving state while leaving so the ballot can't be resubmitted.
		router.push("/judge");
	}

	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col gap-10">
			<header className="-ml-2 flex items-center gap-1">
				<Link
					aria-label="Back to dashboard"
					className={buttonVariants({ variant: "ghost", size: "icon-lg" })}
					href="/judge"
					onClick={(event) => saving && event.preventDefault()}
				>
					<ArrowLeftLine aria-hidden className="size-5" />
				</Link>
				<h1 className="m-0 min-w-0 font-medium text-base">{roundName}</h1>
			</header>
			<div
				className="fade-in slide-in-from-bottom-4 outline-none duration-300 motion-safe:animate-in"
				key={String(reviewing)}
				ref={stepContainer}
				tabIndex={-1}
			>
				{reviewing ? (
					<ReviewStep
						disabled={saving}
						finalists={finalists}
						onEdit={() => setReviewing(false)}
						picks={picks}
					/>
				) : (
					<PickStep
						disabled={saving}
						finalists={finalists}
						onToggle={toggle}
						picks={picks}
					/>
				)}
			</div>
			{submit.error && (
				<Alert variant="destructive">
					<AlertDescription>
						{submit.error.message} Your ranking is still here. Try submitting
						again.
					</AlertDescription>
				</Alert>
			)}
			<nav aria-label="Ranking steps" className="flex items-center gap-3">
				{reviewing ? (
					<>
						<Button
							disabled={saving}
							onClick={() => setReviewing(false)}
							variant="ghost"
						>
							<ArrowLeftLine data-icon="inline-start" />
							Back
						</Button>
						<Button
							className="ml-auto"
							disabled={saving || !complete}
							onClick={() => void save()}
						>
							{saving
								? "Submitting…"
								: submitted
									? "Update ranking"
									: "Submit ranking"}
						</Button>
					</>
				) : (
					<Button
						className="ml-auto"
						disabled={!complete}
						onClick={() => setReviewing(true)}
					>
						Review ranking
					</Button>
				)}
			</nav>
		</div>
	);
}
