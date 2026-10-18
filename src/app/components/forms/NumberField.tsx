"use client";

import { useId } from "react";
import {
	type Control,
	type FieldPath,
	type FieldValues,
	useController
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import {
	NumberFieldDecrement,
	NumberFieldGroup,
	NumberFieldIncrement,
	NumberFieldInput,
	NumberField as NumberFieldRoot
} from "@/app/components/ui/number-field";

type NumberFieldProps<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues
> = {
	control: Control<TFieldValues, unknown, TTransformedValues>;
	name: TName;
	label: string;
	min?: number;
	max?: number;
	placeholder?: string;
	disabled?: boolean;
};

/** A number with − and + buttons. The value is a number, or null when empty. */
export function NumberField<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues = TFieldValues
>({
	control,
	name,
	label,
	min,
	max,
	placeholder,
	disabled
}: NumberFieldProps<TFieldValues, TName, TTransformedValues>) {
	const { field, fieldState } = useController({ control, name });
	const id = useId();

	return (
		<Field data-disabled={disabled} data-invalid={fieldState.invalid}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			{/* Typed values aren't clamped to min/max, so validation can explain
			    what's wrong; the buttons still stay within them. */}
			<NumberFieldRoot
				allowOutOfRange
				disabled={disabled}
				id={id}
				inputRef={field.ref}
				max={max}
				min={min}
				name={field.name}
				onValueChange={field.onChange}
				value={typeof field.value === "number" ? field.value : null}
			>
				<NumberFieldGroup>
					<NumberFieldInput
						aria-invalid={fieldState.invalid}
						onBlur={field.onBlur}
						placeholder={placeholder}
					/>
					<NumberFieldDecrement
						aria-label={`Decrease ${label.toLowerCase()}`}
					/>
					<NumberFieldIncrement
						aria-label={`Increase ${label.toLowerCase()}`}
					/>
				</NumberFieldGroup>
			</NumberFieldRoot>
			<FieldError errors={[fieldState.error]} />
		</Field>
	);
}
