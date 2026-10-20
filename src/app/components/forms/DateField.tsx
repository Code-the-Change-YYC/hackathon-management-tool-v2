"use client";

import { CalendarLine } from "@mingcute/react";
import { format, isValid, parse } from "date-fns";
import { useId, useState } from "react";
import {
	type Control,
	type FieldPath,
	type FieldValues,
	useController
} from "react-hook-form";
import { Button } from "@/app/components/ui/button";
import { Calendar } from "@/app/components/ui/calendar";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from "@/app/components/ui/popover";

const DATE_KEY_FORMAT = "yyyy-MM-dd";

function parseDateKey(value?: string) {
	const day = parse(value ?? "", DATE_KEY_FORMAT, new Date());
	return isValid(day) ? day : undefined;
}

type DateFieldProps<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues
> = {
	control: Control<TFieldValues, unknown, TTransformedValues>;
	name: TName;
	label: string;
	disabled?: boolean;
	min?: string;
	max?: string;
};

// Edits a "yyyy-MM-dd" string, like a date input. The calendar works on plain
// days in the browser's time zone, so the picked day never shifts no matter
// where the viewer is.
export function DateField<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues = TFieldValues
>({
	control,
	name,
	label,
	disabled,
	min,
	max
}: DateFieldProps<TFieldValues, TName, TTransformedValues>) {
	const { field, fieldState } = useController({ control, name });
	const [open, setOpen] = useState(false);
	const id = useId();
	const labelId = `${id}-label`;
	const valueId = `${id}-value`;
	const selected = parseDateKey(field.value);
	const firstDay = parseDateKey(min);
	const lastDay = parseDateKey(max);

	return (
		<Field data-disabled={disabled} data-invalid={fieldState.invalid}>
			<FieldLabel htmlFor={id} id={labelId}>
				{label}
			</FieldLabel>
			<Popover onOpenChange={setOpen} open={open}>
				<PopoverTrigger
					render={
						<Button
							aria-invalid={fieldState.invalid}
							aria-labelledby={`${labelId} ${valueId}`}
							className="h-10 justify-start border-input bg-transparent px-3.5 font-normal has-data-[icon=inline-start]:pl-3 data-[empty=true]:text-muted-foreground md:text-sm"
							data-empty={!selected}
							disabled={disabled}
							id={id}
							onBlur={field.onBlur}
							ref={field.ref}
							variant="outline"
						/>
					}
				>
					<CalendarLine data-icon="inline-start" />
					<span className="truncate" id={valueId}>
						{selected ? format(selected, "EEEE, MMMM d, yyyy") : "Pick a date"}
					</span>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-auto overflow-hidden p-0">
					<Calendar
						defaultMonth={selected ?? firstDay}
						disabled={[
							...(firstDay ? [{ before: firstDay }] : []),
							...(lastDay ? [{ after: lastDay }] : [])
						]}
						mode="single"
						onSelect={(date) => {
							field.onChange(date ? format(date, DATE_KEY_FORMAT) : "");
							setOpen(false);
						}}
						selected={selected}
					/>
				</PopoverContent>
			</Popover>
			<FieldError errors={[fieldState.error]} />
		</Field>
	);
}
