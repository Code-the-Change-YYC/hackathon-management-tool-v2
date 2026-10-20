"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Field, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { RESET_CONFIRMATION_PHRASE } from "@/lib/constants";
import { fromDateInputValue, toDateInputValue } from "@/lib/datetime";
import { api } from "@/trpc/react";

type Action = "create" | "reset";

const RESET_FIELDS = [
	{ key: "users", label: "Reset Users" },
	{ key: "teams", label: "Reset Teams" },
	{ key: "rooms", label: "Reset Rooms" },
	{ key: "scores", label: "Reset Scores" }
] as const;

type ResetSelection = Record<(typeof RESET_FIELDS)[number]["key"], boolean>;

const NO_RESETS: ResetSelection = {
	users: false,
	teams: false,
	rooms: false,
	scores: false
};

const ACTIONS = [
	{ value: "create", label: "Create hackathon" },
	{ value: "reset", label: "Reset hackathon" }
] as const;

const sectionTitle = "font-medium text-xl";

export default function AdminControlsView() {
	const utils = api.useUtils();
	const { data: settings } = api.hackathonSettings.get.useQuery();
	const [action, setAction] = useState<Action | null>(null);
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [resets, setResets] = useState(NO_RESETS);
	const [confirmation, setConfirmation] = useState("");

	useEffect(() => {
		setStartDate(toDateInputValue(settings?.startDate));
		setEndDate(toDateInputValue(settings?.endDate));
	}, [settings]);

	const createHackathon = api.hackathonSettings.update.useMutation({
		onSuccess: async () => {
			toast.success("Hackathon successfully created");
			await utils.hackathonSettings.get.invalidate();
		},
		onError: () => toast.error("We couldn’t create the hackathon.")
	});
	const resetHackathon = api.hackathonSettings.resetHackathon.useMutation({
		onSuccess: async () => {
			toast.success("Hackathon successfully reset");
			setAction(null);
			setResets(NO_RESETS);
			setConfirmation("");
			await utils.invalidate();
		},
		onError: () => toast.error("We couldn’t reset the hackathon.")
	});

	const scoresIncluded = resets.teams || resets.rooms;
	const selection = { ...resets, scores: resets.scores || scoresIncluded };
	const start = fromDateInputValue(startDate, settings?.startDate);
	const end = fromDateInputValue(endDate, settings?.endDate);
	const datesInvalid = Boolean(start && end && end <= start);
	const isPending = createHackathon.isPending || resetHackathon.isPending;
	const canSubmit =
		action === "create"
			? Boolean(start && end) && !datesInvalid
			: action === "reset" &&
				Object.values(selection).some(Boolean) &&
				confirmation.trim() === RESET_CONFIRMATION_PHRASE;

	function submit() {
		if (action === "create" && start && end) {
			createHackathon.mutate({
				startDate: start,
				endDate: end,
				isActive: true
			});
		} else if (action === "reset") {
			resetHackathon.mutate({
				...selection,
				confirmation: RESET_CONFIRMATION_PHRASE
			});
		}
	}

	return (
		<div className="flex min-h-svh flex-1 flex-col gap-12 bg-white p-6">
			<PageHeader
				description="Create or reset the hackathon"
				title="Admin Controls"
			/>

			<section aria-labelledby="dates-title" className="flex flex-col gap-4">
				<h2 className={sectionTitle} id="dates-title">
					Set Hackathon Dates
				</h2>
				<div className="grid gap-4 md:grid-cols-2 md:gap-16">
					<Field data-invalid={datesInvalid}>
						<FieldLabel htmlFor="hackathon-start">Start Date</FieldLabel>
						<Input
							disabled={action !== "create"}
							id="hackathon-start"
							onChange={(event) => setStartDate(event.target.value)}
							type="date"
							value={startDate}
						/>
					</Field>
					<Field data-invalid={datesInvalid}>
						<FieldLabel htmlFor="hackathon-end">End Date</FieldLabel>
						<Input
							aria-describedby="hackathon-dates-error"
							aria-invalid={datesInvalid}
							disabled={action !== "create"}
							id="hackathon-end"
							onChange={(event) => setEndDate(event.target.value)}
							type="date"
							value={endDate}
						/>
						{datesInvalid && (
							<p
								className="text-destructive text-sm"
								id="hackathon-dates-error"
							>
								The end date must be after the start date.
							</p>
						)}
					</Field>
				</div>
			</section>

			<div className="grid gap-12 md:grid-cols-2 md:gap-16">
				<section aria-labelledby="action-title" className="flex flex-col gap-4">
					<h2 className={sectionTitle} id="action-title">
						Hackathon Action
					</h2>
					<RadioGroup
						aria-labelledby="action-title"
						onValueChange={(value) => {
							setAction(value);
							setResets(NO_RESETS);
							setConfirmation("");
						}}
						value={action}
					>
						{ACTIONS.map(({ value, label }) => (
							<label
								className="flex h-12 items-center gap-4"
								htmlFor={`action-${value}`}
								key={value}
							>
								<RadioGroupItem
									className="size-5"
									id={`action-${value}`}
									value={value}
								/>
								{label}
							</label>
						))}
					</RadioGroup>
				</section>

				<section aria-labelledby="reset-title" className="flex flex-col gap-4">
					<h2 className={sectionTitle} id="reset-title">
						Reset Fields
					</h2>
					<div className="flex flex-col gap-2">
						{RESET_FIELDS.map(({ key, label }) => {
							const included = key === "scores" && scoresIncluded;
							return (
								<label
									className="flex min-h-12 items-center gap-4 p-2"
									htmlFor={`reset-${key}`}
									key={key}
								>
									<Checkbox
										checked={selection[key]}
										disabled={action !== "reset" || included}
										id={`reset-${key}`}
										onCheckedChange={(checked) =>
											setResets({ ...resets, [key]: checked === true })
										}
									/>
									<span className="flex flex-col">
										{label}
										{included && (
											<span className="text-muted-foreground text-sm">
												Included with teams or rooms
											</span>
										)}
									</span>
								</label>
							);
						})}
					</div>
				</section>
			</div>

			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-end">
				<Field className="md:w-100">
					<FieldLabel htmlFor="reset-confirmation">
						Enter “{RESET_CONFIRMATION_PHRASE}” to confirm reset
					</FieldLabel>
					<Input
						autoComplete="off"
						disabled={action !== "reset"}
						id="reset-confirmation"
						onChange={(event) => setConfirmation(event.target.value)}
						placeholder={RESET_CONFIRMATION_PHRASE}
						value={confirmation}
					/>
				</Field>
				<Button
					className="self-end"
					disabled={!canSubmit || isPending}
					onClick={submit}
				>
					Submit Changes
				</Button>
			</div>
		</div>
	);
}
