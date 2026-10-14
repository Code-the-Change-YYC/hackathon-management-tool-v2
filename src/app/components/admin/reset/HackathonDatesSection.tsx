import { twMerge } from "tailwind-merge";
import { Field, FieldLabel } from "../../ui/field";
import { Input } from "../../ui/input";

type HackathonDatesSectionProps = {
	endDate: string;
	onEndDateChange: (value: string) => void;
	onStartDateChange: (value: string) => void;
	selectedAction: "create" | "reset" | "";
	startDate: string;
};

export function HackathonDatesSection({
	endDate,
	onEndDateChange,
	onStartDateChange,
	selectedAction,
	startDate
}: HackathonDatesSectionProps) {
	const isDisabled = selectedAction !== "create";

	return (
		<div
			className={twMerge(
				"flex flex-col gap-4",
				selectedAction === "create" ? "opacity-100" : "opacity-50"
			)}
		>
			<p className="font-medium text-[22px] leading-7">Set Hackathon Dates</p>

			<div className="flex w-full flex-col gap-4 md:flex-row md:gap-16">
				<div className="flex w-full flex-col gap-2">
					<Field>
						<FieldLabel className="pl-4 font-regular text-[14px] leading-5">
							Start Date
						</FieldLabel>

						<Input
							className="row-start-2 w-full rounded-[12px] border py-3 pr-3 pl-4 text-4 leading-6"
							disabled={isDisabled}
							onChange={(event) => onStartDateChange(event.target.value)}
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
							disabled={isDisabled}
							onChange={(event) => onEndDateChange(event.target.value)}
							type="date"
							value={endDate}
						/>
					</Field>
				</div>
			</div>
		</div>
	);
}
