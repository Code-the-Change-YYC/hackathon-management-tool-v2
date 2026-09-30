"use client";

import { useEffect, useMemo, useState } from "react";
import { Field, FieldGroup, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import {
	JUDGING_PHASE_LABELS,
	JUDGING_PHASES,
	type JudgingPhase
} from "@/lib/participant-events";
import { api } from "@/trpc/react";

function toDateTimeLocal(value: Date | null | undefined): string {
	if (!value) return "";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(
		value.getHours()
	)}:${pad(value.getMinutes())}`;
}

export default function HackathonSettingsPanel() {
	const utils = api.useUtils();
	const { data: settings } = api.hackathonSettings.get.useQuery();
	const { data: rounds } = api.judgingRounds.getAll.useQuery();

	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [submissionDeadline, setSubmissionDeadline] = useState("");
	const [judgingPhase, setJudgingPhase] = useState<JudgingPhase>("not_started");
	const [timeZone, setTimeZone] = useState("America/Edmonton");
	const [isActive, setIsActive] = useState(true);
	const [currentRoundId, setCurrentRoundId] = useState("");

	useEffect(() => {
		setSubmissionDeadline(toDateTimeLocal(settings?.submissionDeadline));
		setJudgingPhase(settings?.judgingPhase ?? "not_started");
		setTimeZone(settings?.timeZone ?? "America/Edmonton");
		setStartDate(toDateTimeLocal(settings?.startDate ?? null));
		setEndDate(toDateTimeLocal(settings?.endDate ?? null));
		setIsActive(settings?.isActive ?? true);
		setCurrentRoundId(settings?.currentRoundId ?? "");
	}, [
		settings?.submissionDeadline,
		settings?.judgingPhase,
		settings?.timeZone,
		settings?.currentRoundId,
		settings?.endDate,
		settings?.isActive,
		settings?.startDate
	]);

	const update = api.hackathonSettings.update.useMutation({
		onSuccess: async () => {
			await utils.hackathonSettings.get.invalidate();
		}
	});

	const status = useMemo(() => {
		if (update.isPending) return "Saving settings...";
		if (update.isSuccess) return "Settings saved.";
		if (update.error) return `Save failed: ${update.error.message}`;
		return "";
	}, [update.error, update.isPending, update.isSuccess]);

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
							Submission deadline (your local time)
						</FieldLabel>
						<Input
							id="submission-deadline"
							onChange={(e) => setSubmissionDeadline(e.target.value)}
							type="datetime-local"
							value={submissionDeadline}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="dashboard-time-zone">
							Participant time zone
						</FieldLabel>
						<Input
							id="dashboard-time-zone"
							onChange={(e) => setTimeZone(e.target.value)}
							placeholder="America/Edmonton"
							value={timeZone}
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
						{(rounds ?? []).map((round) => (
							<option key={round.id} value={round.id}>
								{round.name}
							</option>
						))}
					</select>
				</label>
			</div>

			<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
				<button
					disabled={update.isPending}
					onClick={() => {
						update.mutate({
							startDate: startDate ? new Date(startDate) : undefined,
							endDate: endDate ? new Date(endDate) : undefined,
							submissionDeadline: submissionDeadline
								? new Date(submissionDeadline)
								: null,
							judgingPhase,
							timeZone,
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
