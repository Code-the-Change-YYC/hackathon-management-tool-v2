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
	InputOTP,
	InputOTPGroup,
	InputOTPSlot
} from "@/app/components/ui/input-otp";
import { cn } from "@/lib/utils";

type CodeFieldProps<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues
> = {
	control: Control<TFieldValues, unknown, TTransformedValues>;
	name: TName;
	label: string;
	/** Keeps the label for screen readers only, when the page already explains the field. */
	hideLabel?: boolean;
	length: number;
	/** Regex source each character must match, e.g. `REGEXP_ONLY_DIGITS`. */
	pattern: string;
	inputMode?: "numeric" | "text";
	autoComplete?: string;
	disabled?: boolean;
};

/** A code input with one box per character, like verification codes. */
export function CodeField<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues = TFieldValues
>({
	control,
	name,
	label,
	hideLabel,
	length,
	pattern,
	inputMode = "numeric",
	autoComplete,
	disabled
}: CodeFieldProps<TFieldValues, TName, TTransformedValues>) {
	const { field, fieldState } = useController({ control, name });
	const id = useId();
	const slots = Array.from({ length }, (_, index) => index);

	return (
		<Field
			className="py-4"
			data-disabled={disabled}
			data-invalid={fieldState.invalid}
		>
			<FieldLabel
				className={cn(
					"justify-center text-muted-foreground text-xs",
					hideLabel && "sr-only"
				)}
				htmlFor={id}
			>
				{label}
			</FieldLabel>
			<InputOTP
				autoComplete={autoComplete}
				containerClassName="justify-between sm:justify-center sm:gap-4"
				disabled={disabled}
				id={id}
				inputMode={inputMode}
				maxLength={length}
				name={field.name}
				onBlur={field.onBlur}
				onChange={field.onChange}
				pattern={pattern}
				ref={field.ref}
				value={field.value}
			>
				{slots.map((slot) => (
					<InputOTPGroup key={slot}>
						<InputOTPSlot
							aria-invalid={fieldState.invalid}
							className="h-13 w-12 font-medium text-[22px] uppercase"
							index={slot}
						/>
					</InputOTPGroup>
				))}
			</InputOTP>
			<FieldError className="text-center" errors={[fieldState.error]} />
		</Field>
	);
}
