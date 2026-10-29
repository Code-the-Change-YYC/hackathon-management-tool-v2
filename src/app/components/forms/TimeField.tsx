"use client";

import type { ComponentProps } from "react";
import type { FieldPath, FieldValues } from "react-hook-form";
import { TextField } from "@/app/components/forms/TextField";
import { cn } from "@/lib/utils";

type TimeFieldProps<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues
> = Omit<
	ComponentProps<typeof TextField<TFieldValues, TName, TTransformedValues>>,
	"type"
>;

/** A time field without the browser's clock icon. The value is "HH:mm". */
export function TimeField<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues = TFieldValues
>({
	className,
	...textFieldProps
}: TimeFieldProps<TFieldValues, TName, TTransformedValues>) {
	return (
		<TextField
			{...textFieldProps}
			className={cn(
				"appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
				className
			)}
			type="time"
		/>
	);
}
