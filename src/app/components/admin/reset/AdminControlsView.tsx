"use client";

import { AddLine } from "@mingcute/react";
import { Fragment, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { RESET_CONFIRMATION_PHRASE } from "@/lib/constants";
import { api, type RouterOutputs } from "@/trpc/react";
import PageHeader from "../../PageHeader";
import { Field, FieldLabel } from "../../ui/field";
import { Input } from "../../ui/input";

type Criterion = RouterOutputs["criteria"]["getAll"][number];

function formatDateInput(value: Date | string | null | undefined) {
	if (!value) return "";

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";

	const pad = (part: number) => String(part).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateInput(value: string) {
	if (!value) return null;

	const parts = value.split("-").map(Number);
	if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
		return null;
	}

	const [year, month, day] = parts;
	if (year === undefined || month === undefined || day === undefined) {
		return null;
	}

	const parsed = new Date(year, month - 1, day);
	if (
		parsed.getFullYear() !== year ||
		parsed.getMonth() !== month - 1 ||
		parsed.getDate() !== day
	) {
		return null;
	}

	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function ScoringSection({
	name,
	placeholder,
	items = [],
	sidepot,
	handleCreate,
	handleDelete
}: {
	name: string;
	placeholder: string;
	items?: Criterion[];
	sidepot: boolean;
	handleCreate: (name: string, isSidepot: boolean) => Promise<Criterion | null>;
	handleDelete: (id: string) => Promise<{ success: boolean }>;
}) {
	const [addText, setAddText] = useState("");
	const { confirm, dialogProps } = useConfirmDialog();

	const createItem = useCallback(async () => {
		const name = addText.trim();

		if (!name) return;

		const result = await handleCreate(name, sidepot);

		if (result) {
			setAddText("");
		}
	}, [addText, handleCreate, sidepot]);

	const deleteItem = useCallback(
		async (item: Criterion) => {
			if (
				!(await confirm({
					title: `Delete "${item.name}"?`,
					description:
						"This will also remove all scores recorded for this criterion.",
					confirmLabel: "Delete",
					destructive: true
				}))
			)
				return;

			try {
				await handleDelete(item.id);
				toast.success("Deleted");
			} catch (error) {
				console.error(error);
				toast.error("Failed to delete");
			}
		},
		[confirm, handleDelete]
	);

	return (
		<div className="flex w-full flex-col gap-7">
			<div className="grid w-full grid-cols-[1fr_max-content] grid-rows-[max-content_max-content] items-center gap-x-4 gap-y-2 pr-4">
				<p className="pl-4 font-regular text-[14px] leading-5">{name}</p>

				<textarea
					className="field-sizing-content row-start-2 w-full resize-none rounded-[12px] border py-3 pr-3 pl-4 text-4 leading-6"
					onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
						setAddText(event.target.value);
					}}
					onKeyDown={(event) => {
						if (event.key === "Enter" && !event.shiftKey) {
							event.preventDefault();
							void createItem();
						}
					}}
					placeholder={placeholder}
					rows={1}
					value={addText}
				/>

				<Button
					className="row-start-2"
					onClick={() => void createItem()}
					type="button"
				>
					<AddLine aria-label="Add" className="size-5" />
					<p className="font-medium text-4 text-white leading-6">Add</p>
				</Button>
			</div>

			<div className="grid grid-cols-[1fr_max-content] justify-center gap-4">
				{items.map((item) => (
					<Fragment key={item.id}>
						<div className="field-sizing-content w-full resize-none rounded-[12px] border bg-muted py-3 pr-3 pl-4 text-4 leading-6">
							{item.name}
						</div>

						<Button
							className="bg-strawberry-red text-white hover:bg-strawberry-red/90"
							onClick={() => void deleteItem(item)}
							type="button"
							variant="destructive"
						>
							<AddLine aria-label="Remove" className="size-5 rotate-45" />
							<p className="font-medium text-4 text-white leading-6">Remove</p>
						</Button>
					</Fragment>
				))}
			</div>

			<ConfirmAlertDialog {...dialogProps} />
		</div>
	);
}

export default function AdminControlsView() {
	const utils = api.useUtils();

	const { data: criteriaData = [], isLoading: criteriaLoading } =
		api.criteria.getAll.useQuery();

	const { data: settings } = api.hackathonSettings.get.useQuery();

	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
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

	useEffect(() => {
		if (!settings) return;

		setStartDate(formatDateInput(settings.startDate));
		setEndDate(formatDateInput(settings.endDate));
	}, [settings]);

	const createCriteriaMutation = api.criteria.create.useMutation({
		onSuccess: async () => {
			await utils.criteria.getAll.invalidate();
		}
	});

	const deleteCriteriaMutation = api.criteria.delete.useMutation({
		onSuccess: async () => {
			await utils.criteria.getAll.invalidate();
		}
	});

	const updateSettingsMutation = api.hackathonSettings.update.useMutation({
		onSuccess: async () => {
			await utils.hackathonSettings.get.invalidate();
		}
	});

	const resetHackathonMutation =
		api.hackathonSettings.resetHackathon.useMutation({
			onSuccess: async () => {
				await utils.invalidate();
			}
		});

	const mainCriteria = criteriaData.filter((criterion) => !criterion.isSidepot);
	const sidepots = criteriaData.filter((criterion) => criterion.isSidepot);

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
		const start = parseDateInput(startDate);
		const end = parseDateInput(endDate);

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
	}, [endDate, startDate, updateSettingsMutation]);

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

	if (criteriaLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				Loading...
			</div>
		);
	}

	return (
		<div className="flex w-fill flex-col gap-6 p-6">
			<PageHeader
				description="Reset hackathon, edit scoring components"
				title="Admin Controls"
			/>

			<div className="flex flex-col gap-21">
				<div className="flex flex-col gap-16">
					<div className="flex flex-col gap-4">
						<p className="font-medium text-[22px] leading-7">
							Set Scoring Categories
						</p>

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

				<div
					className={twMerge(
						"flex flex-col gap-4",
						selectedAction === "create" ? "opacity-100" : "opacity-50"
					)}
				>
					<p className="font-medium text-[22px] leading-7">
						Set Hackathon Dates
					</p>

					<div className="flex w-full flex-col gap-4 md:flex-row md:gap-16">
						<div className="flex w-full flex-col gap-2">
							<Field>
								<FieldLabel className="pl-4 font-regular text-[14px] leading-5">
									Start Date
								</FieldLabel>

								<Input
									className="row-start-2 w-full rounded-[12px] border py-3 pr-3 pl-4 text-4 leading-6"
									disabled={selectedAction !== "create"}
									onChange={(event) => setStartDate(event.target.value)}
									type="date"
									value={startDate}
								/>
							</Field>
						</div>

						<div className="flex w-full flex-col gap-2">
							<Field>
								<FieldLabel className="pl-4 font-regular text-[14px] leading-5">
									End Date
								</FieldLabel>

								<Input
									className="row-start-2 w-full rounded-[12px] border py-3 pr-3 pl-4 text-4 leading-6"
									disabled={selectedAction !== "create"}
									onChange={(event) => setEndDate(event.target.value)}
									type="date"
									value={endDate}
								/>
							</Field>
						</div>
					</div>
				</div>

				<div className="flex w-full flex-col gap-16 md:flex-row">
					<div className="flex w-full flex-col gap-4">
						<p className="font-medium text-[22px] leading-7">Action</p>

						<RadioGroup
							className="flex flex-col gap-2"
							onValueChange={(value) => {
								if (value === "create" || value === "reset") {
									setSelectedAction(value);
									if (value === "create") {
										setResetUsers(false);
										setResetTeams(false);
										setResetRooms(false);
										setResetScores(false);
										setConfirmation("");
									}
								}
							}}
							value={selectedAction}
						>
							<label
								className="flex h-12 flex-row items-center gap-4"
								htmlFor="create_hackathon"
							>
								<RadioGroupItem
									className="h-5 w-5 p-2"
									id="create_hackathon"
									value="create"
								/>
								<p className="font-regular text-4 leading-6">
									Create hackathon
								</p>
							</label>

							<label
								className="flex h-12 flex-row items-center gap-4"
								htmlFor="reset_hackathon"
							>
								<RadioGroupItem
									className="h-5 w-5 p-2"
									id="reset_hackathon"
									value="reset"
								/>
								<p className="font-regular text-4 leading-6">Reset hackathon</p>
							</label>
						</RadioGroup>
					</div>

					<div
						className={twMerge(
							"flex w-full flex-col gap-4",
							selectedAction === "reset" ? "opacity-100" : "opacity-50"
						)}
					>
						<p className="font-medium text-[22px] leading-7">Reset Fields</p>

						<div className="flex flex-col gap-2">
							<label
								className="flex h-12 flex-row items-center gap-4 p-2"
								htmlFor="reset_users"
							>
								<Checkbox
									checked={resetUsers}
									disabled={selectedAction !== "reset"}
									id="reset_users"
									onCheckedChange={(checked) => setResetUsers(checked === true)}
								/>
								<p className="font-regular text-4 leading-6">Reset Users</p>
							</label>

							<label
								className="flex h-12 flex-row items-center gap-4 p-2"
								htmlFor="reset_teams"
							>
								<Checkbox
									checked={resetTeams}
									disabled={selectedAction !== "reset"}
									id="reset_teams"
									onCheckedChange={(checked) => setResetTeams(checked === true)}
								/>
								<p className="font-regular text-4 leading-6">Reset Teams</p>
							</label>

							<label
								className="flex h-12 flex-row items-center gap-4 p-2"
								htmlFor="reset_rooms"
							>
								<Checkbox
									checked={resetRooms}
									disabled={selectedAction !== "reset"}
									id="reset_rooms"
									onCheckedChange={(checked) => setResetRooms(checked === true)}
								/>
								<p className="font-regular text-4 leading-6">Reset Rooms</p>
							</label>

							<label
								className="flex h-12 flex-row items-center gap-4 p-2"
								htmlFor="reset_scores"
							>
								<Checkbox
									checked={willResetScores}
									disabled={
										selectedAction !== "reset" || scoresAreImplicitlyReset
									}
									id="reset_scores"
									onCheckedChange={(checked) =>
										setResetScores(checked === true)
									}
								/>
								<span className="flex flex-col">
									<span className="font-regular text-4 leading-6">
										Reset Scores
									</span>
									{scoresAreImplicitlyReset ? (
										<span className="text-muted-foreground text-sm">
											Included with teams or rooms
										</span>
									) : null}
								</span>
							</label>
						</div>
					</div>
				</div>

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
							resetHackathonMutation.isPending
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
