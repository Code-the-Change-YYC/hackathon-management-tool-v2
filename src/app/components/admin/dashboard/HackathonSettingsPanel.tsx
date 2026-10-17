"use client";

import { useState } from "react";
import { Field, FieldGroup, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { useRefresh } from "@/hooks/use-refresh";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "@/lib/datetime";
import {
	JUDGING_PHASE_LABELS,
	JUDGING_PHASES,
	type JudgingPhase
} from "@/lib/judging";
import { api, type RouterOutputs } from "@/trpc/react";

export function HackathonSettingsPanel({
	settings,
	rounds
}: {
	settings: RouterOutputs["hackathonSettings"]["get"];
	rounds: RouterOutputs["judgingRounds"]["getAll"];
}) {
	const { isRefreshing, refresh } = useRefresh();
	const [startDate, setStartDate] = useState(() =>
		toDateTimeLocalValue(settings?.startDate)
	);
	const [endDate, setEndDate] = useState(() =>
		toDateTimeLocalValue(settings?.endDate)
	);
	const [submissionDeadline, setSubmissionDeadline] = useState(() =>
		toDateTimeLocalValue(settings?.submissionDeadline)
	);
	const [judgingPhase, setJudgingPhase] = useState<JudgingPhase>(
		settings?.judgingPhase ?? "not_started"
	);
	const [isActive, setIsActive] = useState(settings?.isActive ?? true);
	const [currentRoundId, setCurrentRoundId] = useState(
		settings?.currentRoundId ?? ""
	);

	const update = api.hackathonSettings.update.useMutation({
		onSuccess: () => refresh()
	});
	const isSaving = update.isPending || isRefreshing;

	let status = "";
	if (isSaving) status = "Saving settings...";
	else if (update.isSuccess) status = "Settings saved.";
	else if (update.error) status = `Save failed: ${update.error.message}`;

	return (
		// TODO: remove height and width inline style
		<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
			<div
				style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "end" }}
			>
				<label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
					<span>Hackathon Start</span>
					<input
						onChange={(e) => setStartDate(e.target.value)}
						type="datetime-local"
						value={startDate}
					/>
				</label>
				<label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
					<span>Hackathon End</span>
					<input
						onChange={(e) => setEndDate(e.target.value)}
						type="datetime-local"
						value={endDate}
					/>
				</label>
				<FieldGroup className="max-w-sm">
					<Field>
						<FieldLabel htmlFor="submission-deadline">
							Submission deadline
						</FieldLabel>
						<Input
							id="submission-deadline"
							onChange={(e) => setSubmissionDeadline(e.target.value)}
							type="datetime-local"
							value={submissionDeadline}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="dashboard-judging-phase">
							Participant judging phase
						</FieldLabel>
						<select
							id="dashboard-judging-phase"
							onChange={(e) => setJudgingPhase(e.target.value as JudgingPhase)}
							value={judgingPhase}
						>
							{JUDGING_PHASES.map((phase) => (
								<option key={phase} value={phase}>
									{JUDGING_PHASE_LABELS[phase]}
								</option>
							))}
						</select>
					</Field>
				</FieldGroup>

				<label style={{ display: "flex", alignItems: "center", gap: 6 }}>
					<input
						checked={isActive}
						onChange={(e) => setIsActive(e.target.checked)}
						type="checkbox"
					/>
					Active
				</label>
				<label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
					<span>Active Judging Round</span>
					<select
						onChange={(e) => setCurrentRoundId(e.target.value)}
						value={currentRoundId}
					>
						<option value="">None</option>
						{rounds.map((round) => (
							<option key={round.id} value={round.id}>
								{round.name}
							</option>
						))}
					</select>
				</label>
			</div>

			<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
				<button
					disabled={isSaving}
					onClick={() => {
						update.mutate({
							startDate: fromDateTimeLocalValue(startDate) ?? undefined,
							endDate: fromDateTimeLocalValue(endDate) ?? undefined,
							submissionDeadline: fromDateTimeLocalValue(submissionDeadline),
							judgingPhase,
							isActive,
							currentRoundId: currentRoundId || null
						});
					}}
					type="button"
				>
					Save Settings
				</button>
				<span style={{ fontSize: 12, opacity: 0.85 }}>{status}</span>
			</div>
		</div>
	);
}
