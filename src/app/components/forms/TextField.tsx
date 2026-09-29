"use client";

import { type ComponentProps, useId } from "react";
import {
	type Control,
	type FieldPath,
	type FieldValues,
	useController
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";

type TextFieldProps<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues
> = Omit<
	ComponentProps<typeof Input>,
	"id" | "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "ref"
> & {
	control: Control<TFieldValues, unknown, TTransformedValues>;
	name: TName;
	label: string;
};

export function TextField<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues = TFieldValues
>({
	control,
	name,
	label,
	...inputProps
}: TextFieldProps<TFieldValues, TName, TTransformedValues>) {
	const { field, fieldState } = useController({ control, name });
	const id = useId();

	return (
		<Field data-invalid={fieldState.invalid}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<Input
				{...field}
				{...inputProps}
				aria-invalid={fieldState.invalid}
				id={id}
			/>
			<FieldError errors={[fieldState.error]} />
		</Field>
	);
}
