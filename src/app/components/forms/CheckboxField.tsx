"use client";

import { type ReactNode, useId } from "react";
import {
	type Control,
	type FieldPath,
	type FieldValues,
	useController
} from "react-hook-form";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel
} from "@/app/components/ui/field";

type CheckboxFieldProps<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues
> = {
	control: Control<TFieldValues, unknown, TTransformedValues>;
	name: TName;
	/** The label, which can include links. */
	children: ReactNode;
	disabled?: boolean;
};

export function CheckboxField<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues = TFieldValues
>({
	control,
	name,
	children,
	disabled
}: CheckboxFieldProps<TFieldValues, TName, TTransformedValues>) {
	const { field, fieldState } = useController({ control, name });
	const id = useId();

	return (
		<Field
			data-disabled={disabled}
			data-invalid={fieldState.invalid}
			orientation="horizontal"
		>
			<Checkbox
				aria-invalid={fieldState.invalid}
				checked={field.value}
				disabled={disabled}
				id={id}
				name={field.name}
				onBlur={field.onBlur}
				onCheckedChange={field.onChange}
				ref={field.ref}
			/>
			<FieldContent>
				<FieldLabel className="block font-normal leading-normal" htmlFor={id}>
					{children}
				</FieldLabel>
				<FieldError errors={[fieldState.error]} />
			</FieldContent>
		</Field>
	);
}
