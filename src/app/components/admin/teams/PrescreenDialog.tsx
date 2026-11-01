"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	CheckLine,
	CloseLine,
	LeftLine,
	RightLine,
	TimeLine
} from "@mingcute/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel
} from "@/app/components/ui/field";
import { Textarea } from "@/app/components/ui/textarea";
import { useRefresh } from "@/hooks/use-refresh";
import {
	type PrescreenFailFormValues,
	prescreenFailFormSchema
} from "@/lib/validation/team";
import { api } from "@/trpc/react";
import { formatMemberNames, type Team } from "./types";

function byName(a: Team, b: Team) {
	return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
}

function StatusLabel({ status }: { status: Team["prescreen"] }) {
	switch (status) {
		case "passed":
			return (
				<span className="flex items-center gap-1.5">
					<CheckLine className="size-4" color="var(--color-green-700)" />
					Passed pre-screening
				</span>
			);
		case "failed":
			return (
				<span className="flex items-center gap-1.5">
					<CloseLine className="size-4" color="var(--color-red-600)" />
					Failed pre-screening
				</span>
			);
		default:
			return (
				<span className="flex items-center gap-1.5 text-muted-foreground">
					<TimeLine className="size-4" />
					Not pre-screened yet
				</span>
			);
	}
}

type PrescreenDialogProps = {
	teams: Team[];
	onClose: () => void;
};

// Steps through teams by name, starting at the first one not yet pre-screened.
export function PrescreenDialog({ teams, onClose }: PrescreenDialogProps) {
	const queue = [...teams].sort(byName);
	const [currentId, setCurrentId] = useState(
		() => (queue.find((team) => team.prescreen === "pending") ?? queue[0])?.id
	);
	const [isFailing, setIsFailing] = useState(false);
	const [isDone, setIsDone] = useState(false);
	const { isRefreshing, refresh } = useRefresh();
	const form = useForm<PrescreenFailFormValues>({
		defaultValues: { feedback: "" },
		resolver: zodResolver(prescreenFailFormSchema)
	});
	const feedbackError = form.formState.errors.feedback;
	const { setFocus } = form;

	useEffect(() => {
		if (isFailing) setFocus("feedback");
	}, [isFailing, setFocus]);

	const index = Math.max(
		0,
		queue.findIndex((team) => team.id === currentId)
	);
	const team = queue[index];
	const pendingCount = queue.filter(
		(entry) => entry.prescreen === "pending"
	).length;

	function showTeam(id: string | undefined) {
		setCurrentId(id);
		setIsFailing(false);
		form.reset({ feedback: "" });
	}

	// `queue` predates the refresh, so only the decided team is out of date.
	function advanceFrom(decided: Team) {
		const from = queue.findIndex((entry) => entry.id === decided.id);
		const next = [...queue.slice(from + 1), ...queue.slice(0, from)].find(
			(entry) => entry.prescreen === "pending"
		);
		if (next) {
			showTeam(next.id);
		} else if (decided.prescreen === "pending") {
			setIsDone(true);
		} else {
			showTeam(decided.id);
		}
	}

	const setPrescreen = api.teams.setPrescreen.useMutation({
		onError: (error) =>
			toast.error(error.message || "Unable to save the pre-screening result.")
	});
	const isPending = setPrescreen.isPending || isRefreshing;

	function decide(
		decided: Team,
		input: { passed: boolean; feedback?: string }
	) {
		setPrescreen.mutate(
			input.passed
				? { teamId: decided.id, status: "passed" }
				: {
						teamId: decided.id,
						status: "failed",
						comments: input.feedback ?? ""
					},
			{
				onSuccess: () =>
					refresh(() => {
						toast.success(
							`${decided.name} ${input.passed ? "passed" : "failed"} pre-screening.`
						);
						advanceFrom(decided);
					})
			}
		);
	}

	function startFailing(failing: Team) {
		form.reset({ feedback: failing.feedback ?? "" });
		setIsFailing(true);
	}

	return (
		<Dialog
			disablePointerDismissal
			onOpenChange={(open) => !open && onClose()}
			open
		>
			<DialogContent>
				{isDone || !team ? (
					<>
						<DialogHeader>
							<DialogTitle>Pre-screening complete</DialogTitle>
							<DialogDescription>
								Every team has been pre-screened.
							</DialogDescription>
						</DialogHeader>
						<Image
							alt=""
							className="mx-auto h-53.25 w-53.25 shrink-0 object-contain"
							height={249}
							src="/svgs/flagGuy.svg"
							width={254}
						/>
						<DialogFooter>
							<Button onClick={onClose}>Done</Button>
							{queue.length > 0 ? (
								<Button
									onClick={() => {
										setIsDone(false);
										showTeam(queue[0]?.id);
									}}
									variant="outline"
								>
									Review teams
								</Button>
							) : null}
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>Pre-screen teams</DialogTitle>
							<DialogDescription>
								{pendingCount === 0
									? "Every team has been pre-screened."
									: `${pendingCount.toLocaleString()} ${pendingCount === 1 ? "team" : "teams"} left to pre-screen.`}
							</DialogDescription>
						</DialogHeader>

						<div className="flex flex-col gap-4 rounded-xl border p-4">
							<div className="flex items-center justify-between gap-2">
								<Button
									aria-label="Previous team"
									disabled={isPending || index === 0}
									onClick={() => showTeam(queue[index - 1]?.id)}
									size="icon-sm"
									variant="ghost"
								>
									<LeftLine />
								</Button>
								<span className="text-muted-foreground">
									Team {(index + 1).toLocaleString()} of{" "}
									{queue.length.toLocaleString()}
								</span>
								<Button
									aria-label="Next team"
									disabled={isPending || index === queue.length - 1}
									onClick={() => showTeam(queue[index + 1]?.id)}
									size="icon-sm"
									variant="ghost"
								>
									<RightLine />
								</Button>
							</div>
							<div className="flex flex-col gap-1">
								<h3 className="font-semibold text-xl">{team.name}</h3>
								<StatusLabel status={team.prescreen} />
							</div>
							<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
								<dt className="text-muted-foreground">Team code</dt>
								<dd className="tracking-wider">{team.teamCode ?? "n/a"}</dd>
								<dt className="text-muted-foreground">Members</dt>
								<dd>
									{team.members.length > 0 ? formatMemberNames(team) : "n/a"}
								</dd>
								{team.feedback ? (
									<>
										<dt className="text-muted-foreground">Feedback</dt>
										<dd className="whitespace-pre-wrap">{team.feedback}</dd>
									</>
								) : null}
							</dl>
						</div>

						{isFailing ? (
							<form
								className="flex flex-col gap-6"
								noValidate
								onSubmit={form.handleSubmit(({ feedback }) =>
									decide(team, { passed: false, feedback })
								)}
							>
								<Field data-invalid={Boolean(feedbackError)}>
									<FieldLabel htmlFor="prescreen-feedback">Feedback</FieldLabel>
									<Textarea
										aria-invalid={Boolean(feedbackError)}
										disabled={isPending}
										id="prescreen-feedback"
										placeholder="What kept this team from passing?"
										{...form.register("feedback")}
									/>
									<FieldDescription>
										Feedback is required when a team fails.
									</FieldDescription>
									<FieldError errors={[feedbackError]} />
								</Field>
								<div className="grid grid-cols-2 gap-2">
									<Button
										disabled={isPending}
										onClick={() => {
											setIsFailing(false);
											form.reset({ feedback: "" });
										}}
										type="button"
										variant="outline"
									>
										Cancel
									</Button>
									<Button
										disabled={isPending}
										type="submit"
										variant="destructive-solid"
									>
										Fail team
									</Button>
								</div>
							</form>
						) : (
							<div className="grid grid-cols-2 gap-2">
								<Button
									disabled={isPending}
									onClick={() => startFailing(team)}
									variant="destructive-solid"
								>
									<CloseLine data-icon="inline-start" />
									Fail
								</Button>
								<Button
									disabled={isPending}
									onClick={() => decide(team, { passed: true })}
								>
									<CheckLine data-icon="inline-start" />
									Pass
								</Button>
							</div>
						)}
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
