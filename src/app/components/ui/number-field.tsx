"use client";

// Adapted from ReUI's number field (https://reui.io/docs/components/base/number-field)
// to match the other inputs, with both step buttons on the right.

import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field";
import {
	MinimizeLine as MinusIcon,
	AddLine as PlusIcon
} from "@mingcute/react";
import { cn } from "@/lib/utils";

function NumberField({ className, ...props }: NumberFieldPrimitive.Root.Props) {
	return (
		<NumberFieldPrimitive.Root
			className={cn("w-full", className)}
			data-slot="number-field"
			{...props}
		/>
	);
}

function NumberFieldGroup({
	className,
	...props
}: NumberFieldPrimitive.Group.Props) {
	return (
		<NumberFieldPrimitive.Group
			className={cn(
				"flex h-10 w-full min-w-0 items-center gap-0.5 rounded-lg border border-input bg-transparent pr-1.75 transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-1 has-[input[aria-invalid=true]]:ring-destructive data-disabled:pointer-events-none data-disabled:opacity-50 dark:bg-input/30",
				className
			)}
			data-slot="number-field-group"
			{...props}
		/>
	);
}

function NumberFieldInput({
	className,
	...props
}: NumberFieldPrimitive.Input.Props) {
	return (
		<NumberFieldPrimitive.Input
			className={cn(
				"h-full w-full min-w-0 flex-1 bg-transparent px-3.5 text-base outline-none placeholder:text-muted-foreground md:text-sm",
				className
			)}
			data-slot="number-field-input"
			{...props}
		/>
	);
}

const STEP_BUTTON_CLASSES =
	"flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4";

function NumberFieldDecrement({
	className,
	children,
	...props
}: NumberFieldPrimitive.Decrement.Props) {
	return (
		<NumberFieldPrimitive.Decrement
			aria-label="Decrease"
			className={cn(STEP_BUTTON_CLASSES, className)}
			data-slot="number-field-decrement"
			{...props}
		>
			{children ?? <MinusIcon />}
		</NumberFieldPrimitive.Decrement>
	);
}

function NumberFieldIncrement({
	className,
	children,
	...props
}: NumberFieldPrimitive.Increment.Props) {
	return (
		<NumberFieldPrimitive.Increment
			aria-label="Increase"
			className={cn(STEP_BUTTON_CLASSES, className)}
			data-slot="number-field-increment"
			{...props}
		>
			{children ?? <PlusIcon />}
		</NumberFieldPrimitive.Increment>
	);
}

export {
	NumberField,
	NumberFieldDecrement,
	NumberFieldGroup,
	NumberFieldIncrement,
	NumberFieldInput
};
