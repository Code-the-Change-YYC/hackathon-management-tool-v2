"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/button";
import { Field, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { useRefresh } from "@/hooks/use-refresh";
import { RESET_CONFIRMATION_PHRASE } from "@/lib/constants";
import { fromDateInputValue, toDateInputValue } from "@/lib/datetime";
import { api, type RouterOutputs } from "@/trpc/react";
import { HackathonDatesSection } from "./HackathonDatesSection";
import { HackathonResetSection } from "./HackathonResetSection";
import { ScoringSection } from "./ScoringSection";

type Criterion = RouterOutputs["criteria"]["getAll"][number];
type Settings = RouterOutputs["hackathonSettings"]["get"];

export function ControlsView({
	criteria,
	settings
}: {
	criteria: Criterion[];
	settings: Settings;
}) {
	const { isRefreshing, refresh } = useRefresh();

	const [startDate, setStartDate] = useState(() =>
		toDateInputValue(settings?.startDate)
	);
	const [endDate, setEndDate] = useState(() =>
		toDateInputValue(settings?.endDate)
	);
	const [selectedAction, setSelectedAction] = useState<"create" | "reset" | "">(
		""
	);

	const [resetUsers, setResetUsers] = useState(false);
	const [resetTeams, setResetTeams] = useState(false);
	const [resetRooms, setResetRooms] = useState(false);
	const [resetScores, setResetScores] = useState(false);
	const [confirmation, setConfirmation] = useState("");
	const scoresAreImplicitlyReset = resetTeams || resetRooms;
	const willResetScores = resetScores || scoresAreImplicitlyReset;

	const createCriteriaMutation = api.criteria.create.useMutation({
		onSuccess: () => refresh()
	});
	const deleteCriteriaMutation = api.criteria.delete.useMutation({
		onSuccess: () => refresh()
	});
	const updateSettingsMutation = api.hackathonSettings.update.useMutation({
		onSuccess: () => refresh()
	});
	const resetHackathonMutation =
		api.hackathonSettings.resetHackathon.useMutation({
			onSuccess: () => refresh()
		});

	const mainCriteria = criteria.filter((criterion) => !criterion.isSidepot);
	const sidepots = criteria.filter((criterion) => criterion.isSidepot);

	const hasResetSelection =
		resetUsers || resetTeams || resetRooms || resetScores;

	const handleCreateCriteria = useCallback(
		async (name: string, isSidepot: boolean) => {
			try {
				const [result] = await createCriteriaMutation.mutateAsync({
					name,
					isSidepot
				});

				toast.success("Created");
				return result ?? null;
			} catch (error) {
				console.error(error);
				toast.error("Failed to create");
				return null;
			}
		},
		[createCriteriaMutation]
	);

	const handleDeleteCriteria = useCallback(
		(id: string) => {
			return deleteCriteriaMutation.mutateAsync({ id });
		},
		[deleteCriteriaMutation]
	);

	const handleCreateHackathon = useCallback(async () => {
		// Keep any start and end times already set in the hackathon settings.
		const start = fromDateInputValue(startDate, settings?.startDate);
		const end = fromDateInputValue(endDate, settings?.endDate);

		if (!start || !end) {
			toast.error("Both hackathon dates are required.");
			return;
		}

		if (end <= start) {
			toast.error("The end date must be after the start date.");
			return;
		}

		try {
			await updateSettingsMutation.mutateAsync({
				startDate: start,
				endDate: end,
				isActive: true
			});

			toast.success("Hackathon successfully created");
		} catch (error) {
			console.error(error);
			toast.error("Failed to create hackathon");
		}
	}, [
		endDate,
		settings?.endDate,
		settings?.startDate,
		startDate,
		updateSettingsMutation
	]);

	const handleResetHackathon = useCallback(async () => {
		if (!hasResetSelection) {
			toast.error("Select at least one field to reset.");
			return;
		}

		if (confirmation !== RESET_CONFIRMATION_PHRASE) {
			toast.error("Incorrect confirmation text.");
			return;
		}

		try {
			await resetHackathonMutation.mutateAsync({
				confirmation,
				users: resetUsers,
				teams: resetTeams,
				rooms: resetRooms,
				scores: willResetScores
			});
			toast.success("Hackathon successfully reset.");

			setSelectedAction("");
			setResetUsers(false);
			setResetTeams(false);
			setResetRooms(false);
			setResetScores(false);
			setConfirmation("");
		} catch (error) {
			console.error(error);
			toast.error("Failed to reset hackathon");
		}
	}, [
		hasResetSelection,
		resetHackathonMutation,
		resetUsers,
		resetTeams,
		resetRooms,
		willResetScores,
		confirmation
	]);

	const canSubmit =
		selectedAction === "create"
			? Boolean(startDate && endDate)
			: selectedAction === "reset"
				? hasResetSelection && confirmation === RESET_CONFIRMATION_PHRASE
				: false;

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Reset hackathon, edit scoring components"
				title="Admin Controls"
			/>

			<div className="flex flex-col gap-21">
				<div className="flex flex-col gap-16">
					<div className="flex flex-col gap-4">
						<h2 className="font-medium text-xl">Set Scoring Categories</h2>

						<div className="flex w-full flex-col gap-16 md:flex-row">
							<ScoringSection
								handleCreate={handleCreateCriteria}
								handleDelete={handleDeleteCriteria}
								items={mainCriteria}
								name="Scoring Components"
								placeholder="Idea, Effectiveness, Presentation, etc."
								sidepot={false}
							/>

							<ScoringSection
								handleCreate={handleCreateCriteria}
								handleDelete={handleDeleteCriteria}
								items={sidepots}
								name="Scoring Sidepots"
								placeholder="Creativity, Best UI, Use of AI, etc."
								sidepot
							/>
						</div>
					</div>
				</div>

				<HackathonDatesSection
					endDate={endDate}
					onEndDateChange={setEndDate}
					onStartDateChange={setStartDate}
					selectedAction={selectedAction}
					startDate={startDate}
				/>

				<HackathonResetSection
					onActionChange={(value) => {
						setSelectedAction(value);
						if (value === "create") {
							setResetUsers(false);
							setResetTeams(false);
							setResetRooms(false);
							setResetScores(false);
							setConfirmation("");
						}
					}}
					onResetRoomsChange={setResetRooms}
					onResetScoresChange={setResetScores}
					onResetTeamsChange={setResetTeams}
					onResetUsersChange={setResetUsers}
					resetRooms={resetRooms}
					resetTeams={resetTeams}
					resetUsers={resetUsers}
					scoresAreImplicitlyReset={scoresAreImplicitlyReset}
					selectedAction={selectedAction}
					willResetScores={willResetScores}
				/>

				<div className="grid w-full grid-cols-[100%] grid-rows-[max-content_max-content_max-content] justify-end gap-x-4 gap-y-2 pr-4 md:grid-cols-[max-content]">
					<Field>
						<FieldLabel className="w-full pl-4 font-regular text-[14px] leading-5">
							Enter "{RESET_CONFIRMATION_PHRASE}" to confirm reset
						</FieldLabel>

						<Input
							className="row-start-2 w-fill rounded-[12px] border py-3 pr-3 pl-4 text-4 leading-6 md:w-100"
							onChange={(event) => setConfirmation(event.target.value)}
							placeholder={RESET_CONFIRMATION_PHRASE}
							type="text"
							value={confirmation}
						/>
					</Field>

					<Button
						className="row-start-3 justify-self-end md:row-start-2"
						disabled={
							!canSubmit ||
							updateSettingsMutation.isPending ||
							resetHackathonMutation.isPending ||
							isRefreshing
						}
						onClick={() => {
							if (selectedAction === "create") {
								void handleCreateHackathon();
							} else if (selectedAction === "reset") {
								void handleResetHackathon();
							}
						}}
						type="button"
					>
						<p className="font-medium text-4 text-white leading-6">
							Submit Changes
						</p>
					</Button>
				</div>
			</div>
		</div>
	);
}
