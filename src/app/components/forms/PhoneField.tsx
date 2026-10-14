"use client";

import { useId } from "react";
import {
	type Control,
	type FieldPath,
	type FieldValues,
	useController
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import { PhoneInput } from "@/app/components/ui/phone-input";

type PhoneFieldProps<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues
> = {
	control: Control<TFieldValues, unknown, TTransformedValues>;
	name: TName;
	label: string;
	placeholder?: string;
	disabled?: boolean;
};

/** A phone number field. Starts on Canada; the value is in E.164 format. */
export function PhoneField<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues = TFieldValues
>({
	control,
	name,
	label,
	placeholder,
	disabled
}: PhoneFieldProps<TFieldValues, TName, TTransformedValues>) {
	const { field, fieldState } = useController({ control, name });
	const id = useId();

	return (
		<Field data-disabled={disabled} data-invalid={fieldState.invalid}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<PhoneInput
				aria-invalid={fieldState.invalid}
				autoComplete="tel"
				defaultCountry="CA"
				disabled={disabled}
				id={id}
				name={field.name}
				onBlur={field.onBlur}
				onChange={field.onChange}
				placeholder={placeholder}
				ref={field.ref}
				value={field.value}
			/>
			<FieldError errors={[fieldState.error]} />
		</Field>
	);
}
