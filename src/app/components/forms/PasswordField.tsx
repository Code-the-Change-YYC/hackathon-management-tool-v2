"use client";

import { EyeCloseLine, EyeLine } from "@mingcute/react";
import { type ComponentProps, type ReactNode, useId, useState } from "react";
import {
	type Control,
	type FieldPath,
	type FieldValues,
	useController
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput
} from "@/app/components/ui/input-group";
import { cn } from "@/lib/utils";

type PasswordFieldProps<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues
> = Omit<
	ComponentProps<typeof InputGroupInput>,
	| "id"
	| "name"
	| "value"
	| "defaultValue"
	| "onChange"
	| "onBlur"
	| "ref"
	| "type"
> & {
	control: Control<TFieldValues, unknown, TTransformedValues>;
	name: TName;
	label: string;
	description?: ReactNode;
};

export function PasswordField<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues = TFieldValues
>({
	control,
	name,
	label,
	description,
	...inputProps
}: PasswordFieldProps<TFieldValues, TName, TTransformedValues>) {
	const { field, fieldState } = useController({ control, name });
	const [isVisible, setIsVisible] = useState(false);
	const id = useId();
	const descriptionId = `${id}-description`;
	const hasValue = Boolean(field.value);

	return (
		<Field
			data-disabled={inputProps.disabled}
			data-invalid={fieldState.invalid}
		>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<InputGroup>
				<InputGroupInput
					{...field}
					{...inputProps}
					aria-describedby={description ? descriptionId : undefined}
					aria-invalid={fieldState.invalid}
					id={id}
					type={isVisible ? "text" : "password"}
				/>
				<InputGroupAddon align="inline-end">
					<InputGroupButton
						aria-label={isVisible ? "Hide password" : "Show password"}
						aria-pressed={isVisible}
						className="rounded-full [&_svg:not([class*='size-'])]:size-4"
						onClick={() => setIsVisible((visible) => !visible)}
						size="icon-xs"
					>
						{isVisible ? <EyeCloseLine /> : <EyeLine />}
					</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>
			<FieldError errors={[fieldState.error]} />
			{description && (
				// Expands from zero height. While collapsed, the negative margin
				// cancels the field's gap so no empty space is left behind.
				<div
					aria-hidden={!hasValue}
					className={cn(
						"grid transition-[grid-template-rows,opacity,margin,translate] duration-300 ease-out motion-reduce:transition-none",
						hasValue
							? "grid-rows-[1fr] opacity-100"
							: "-mt-2 -translate-y-1 grid-rows-[0fr] opacity-0"
					)}
					id={descriptionId}
				>
					<div className="min-h-0 overflow-hidden">{description}</div>
				</div>
			)}
		</Field>
	);
}
