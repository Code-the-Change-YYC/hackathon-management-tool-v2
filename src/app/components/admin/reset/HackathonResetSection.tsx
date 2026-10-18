import { twMerge } from "tailwind-merge";
import { Checkbox } from "../../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";

type HackathonResetSectionProps = {
	onActionChange: (value: "create" | "reset") => void;
	onResetRoomsChange: (checked: boolean) => void;
	onResetScoresChange: (checked: boolean) => void;
	onResetTeamsChange: (checked: boolean) => void;
	onResetUsersChange: (checked: boolean) => void;
	resetRooms: boolean;
	resetTeams: boolean;
	resetUsers: boolean;
	scoresAreImplicitlyReset: boolean;
	selectedAction: "create" | "reset" | "";
	willResetScores: boolean;
};

export function HackathonResetSection({
	onActionChange,
	onResetRoomsChange,
	onResetScoresChange,
	onResetTeamsChange,
	onResetUsersChange,
	resetRooms,
	resetTeams,
	resetUsers,
	scoresAreImplicitlyReset,
	selectedAction,
	willResetScores
}: HackathonResetSectionProps) {
	const isDisabled = selectedAction !== "reset";

	return (
		<div className="flex w-full flex-col gap-16 md:flex-row">
			<div className="flex w-full flex-col gap-4">
				<p className="font-medium text-[22px] leading-7">Action</p>

				<RadioGroup
					className="flex flex-col gap-2"
					onValueChange={(value) => {
						if (value === "create" || value === "reset") {
							onActionChange(value);
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
						<p className="font-regular text-4 leading-6">Create hackathon</p>
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
							disabled={isDisabled}
							id="reset_users"
							onCheckedChange={(checked) =>
								onResetUsersChange(checked === true)
							}
						/>
						<p className="font-regular text-4 leading-6">Reset Users</p>
					</label>

					<label
						className="flex h-12 flex-row items-center gap-4 p-2"
						htmlFor="reset_teams"
					>
						<Checkbox
							checked={resetTeams}
							disabled={isDisabled}
							id="reset_teams"
							onCheckedChange={(checked) =>
								onResetTeamsChange(checked === true)
							}
						/>
						<p className="font-regular text-4 leading-6">Reset Teams</p>
					</label>

					<label
						className="flex h-12 flex-row items-center gap-4 p-2"
						htmlFor="reset_rooms"
					>
						<Checkbox
							checked={resetRooms}
							disabled={isDisabled}
							id="reset_rooms"
							onCheckedChange={(checked) =>
								onResetRoomsChange(checked === true)
							}
						/>
						<p className="font-regular text-4 leading-6">Reset Rooms</p>
					</label>

					<label
						className="flex h-12 flex-row items-center gap-4 p-2"
						htmlFor="reset_scores"
					>
						<Checkbox
							checked={willResetScores}
							disabled={isDisabled || scoresAreImplicitlyReset}
							id="reset_scores"
							onCheckedChange={(checked) =>
								onResetScoresChange(checked === true)
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
	);
}
