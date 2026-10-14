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
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/app/components/ui/select";

export type SelectOption<TValue = string> = { value: TValue; label: string };

type SelectFieldProps<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues,
	TValue
> = {
	control: Control<TFieldValues, unknown, TTransformedValues>;
	name: TName;
	label: string;
	options: SelectOption<TValue>[];
	placeholder?: string;
	disabled?: boolean;
};

export function SelectField<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues = TFieldValues,
	TValue = string
>({
	control,
	name,
	label,
	options,
	placeholder,
	disabled
}: SelectFieldProps<TFieldValues, TName, TTransformedValues, TValue>) {
	const { field, fieldState } = useController({ control, name });
	const id = useId();

	return (
		<Field data-disabled={disabled} data-invalid={fieldState.invalid}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<Select
				disabled={disabled}
				items={options}
				onValueChange={field.onChange}
				value={field.value ?? null}
			>
				<SelectTrigger
					aria-invalid={fieldState.invalid}
					id={id}
					onBlur={field.onBlur}
					ref={field.ref}
				>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{options.map((option) => (
							<SelectItem key={option.label} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			<FieldError errors={[fieldState.error]} />
		</Field>
	);
}
