"use client";

import { Delete2Line, Edit2Line, More1Line } from "@mingcute/react";
import { useState } from "react";
import { toast } from "sonner";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";
import { useRefresh } from "@/hooks/use-refresh";
import type { HackathonDates } from "@/lib/validation/event";
import { api } from "@/trpc/react";
import { formatRoundTimes, type Round } from "./judgingShared";
import { RoundDialog } from "./RoundDialog";

export function RoundHeader({
	round,
	hasSchedule,
	hasScores,
	hackathonDates
}: {
	round: Round;
	hasSchedule: boolean;
	hasScores: boolean;
	hackathonDates: HackathonDates | null;
}) {
	const { confirm, dialogProps } = useConfirmDialog();
	const { isRefreshing, refresh } = useRefresh();
	const [isEditing, setIsEditing] = useState(false);
	const onError = (error: { message: string }) => toast.error(error.message);
	const publish = api.judgingRounds.publish.useMutation({
		onError,
		onSuccess: () =>
			refresh(() => toast.success("Published. Teams can now see their times."))
	});
	const unpublish = api.judgingRounds.unpublish.useMutation({
		onError,
		onSuccess: () =>
			refresh(() => toast.success("Unpublished. Teams no longer see times."))
	});
	const deleteRound = api.judgingRounds.delete.useMutation({
		onError,
		onSuccess: () => refresh(() => toast.success("Round deleted."))
	});
	const busy =
		isRefreshing ||
		publish.isPending ||
		unpublish.isPending ||
		deleteRound.isPending;

	async function requestDelete() {
		const confirmed = await confirm({
			title: `Delete ${round.name}?`,
			description:
				"Its tables and times will also be deleted. This can’t be undone.",
			confirmLabel: "Delete round",
			destructive: true
		});
		if (confirmed) deleteRound.mutate({ id: round.id });
	}

	return (
		<div className="flex flex-wrap items-center justify-between gap-3">
			<div className="flex flex-wrap items-center gap-2">
				<span className="font-medium">{formatRoundTimes(round)}</span>
				{hasSchedule ? (
					round.publishedAt ? (
						<Badge variant="secondary">Published</Badge>
					) : (
						<Badge variant="outline">Not published</Badge>
					)
				) : null}
			</div>
			<div className="flex items-center gap-2">
				{hasSchedule ? (
					round.publishedAt ? (
						<Button
							disabled={busy}
							onClick={() => unpublish.mutate({ id: round.id })}
							size="sm"
							variant="outline"
						>
							Unpublish
						</Button>
					) : (
						<Button
							disabled={busy}
							onClick={() => publish.mutate({ id: round.id })}
							size="sm"
						>
							Publish schedule
						</Button>
					)
				) : null}
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								aria-label={`Manage ${round.name}`}
								size="icon-sm"
								variant="outline"
							/>
						}
					>
						<More1Line />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuItem
							disabled={hasScores}
							onClick={() => setIsEditing(true)}
						>
							<Edit2Line />
							Edit round
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={hasScores || busy}
							onClick={() => void requestDelete()}
							variant="destructive"
						>
							<Delete2Line />
							Delete round
						</DropdownMenuItem>
						{hasScores ? (
							<>
								<DropdownMenuSeparator />
								<p className="px-1.5 py-1 text-muted-foreground text-xs">
									Scored rounds can’t be edited or deleted.
								</p>
							</>
						) : null}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			{isEditing ? (
				<RoundDialog
					hackathonDates={hackathonDates}
					hasSchedule={hasSchedule}
					onClose={() => setIsEditing(false)}
					round={round}
				/>
			) : null}
			<ConfirmAlertDialog {...dialogProps} />
		</div>
	);
}
