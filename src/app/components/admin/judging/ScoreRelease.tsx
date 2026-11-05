"use client";

import { toast } from "sonner";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardDescription, CardHeader } from "@/app/components/ui/card";
import { useCurrentTime } from "@/hooks/use-current-time";
import { useRefresh } from "@/hooks/use-refresh";
import { getScoreReleaseBlocker } from "@/lib/judging";
import { api } from "@/trpc/react";

export function ScoreRelease({
	released,
	ballotsComplete,
	finalRoundEndTime
}: {
	released: boolean;
	ballotsComplete: boolean;
	finalRoundEndTime: Date | null;
}) {
	const releaseBlocker = getScoreReleaseBlocker(
		finalRoundEndTime,
		useCurrentTime()
	);
	const { confirm, dialogProps } = useConfirmDialog();
	const { isRefreshing, refresh } = useRefresh();
	const setReleased = api.hackathonSettings.setScoresReleased.useMutation({
		onError: (error) => toast.error(error.message),
		onSuccess: (_, { released }) =>
			refresh(() =>
				toast.success(
					released
						? "Scores released. Teams can now see their scores."
						: "Scores hidden from teams."
				)
			)
	});
	const busy = isRefreshing || setReleased.isPending;

	async function requestRelease() {
		const confirmed = await confirm({
			title: "Release scores?",
			description: ballotsComplete
				? "Every team will see its panel-round scores, the winners announcement is marked complete, and judges can no longer change their rankings."
				: "Not every judge has ranked the finalists yet. Every team will see its panel-round scores, the winners announcement is marked complete, and judges can no longer change their rankings.",
			confirmLabel: "Release scores"
		});
		if (confirmed) setReleased.mutate({ released: true });
	}

	async function requestHide() {
		const confirmed = await confirm({
			title: "Hide scores?",
			description:
				"Teams will no longer see their scores until you release them again, and judges can change their rankings.",
			confirmLabel: "Hide scores",
			destructive: true
		});
		if (confirmed) setReleased.mutate({ released: false });
	}

	return (
		<section aria-labelledby="score-release-title">
			<Card>
				<CardHeader className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex min-w-0 flex-col gap-1">
						<div className="flex flex-wrap items-center gap-2">
							<h2 className="font-medium text-lg" id="score-release-title">
								Score release
							</h2>
							{released ? (
								<Badge variant="secondary">Released</Badge>
							) : (
								<Badge variant="outline">Not released</Badge>
							)}
						</div>
						<CardDescription>
							{released
								? "Teams can see their panel-round scores."
								: (releaseBlocker ??
									"Teams can’t see any scores until you release them, usually once the winners are announced.")}
						</CardDescription>
					</div>
					{released ? (
						<Button
							disabled={busy}
							onClick={() => void requestHide()}
							size="sm"
							variant="outline"
						>
							Hide scores
						</Button>
					) : (
						<Button
							disabled={busy || Boolean(releaseBlocker)}
							onClick={() => void requestRelease()}
							size="sm"
						>
							Release scores
						</Button>
					)}
				</CardHeader>
			</Card>
			<ConfirmAlertDialog {...dialogProps} />
		</section>
	);
}
