"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { type ComponentProps, useEffect, useState } from "react";
import { CloseIcon } from "@/app/components/layout/icons";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogOverlay,
	DialogPortal
} from "@/app/components/ui/dialog";
import { cn } from "@/lib/utils";

export function PrimaryButton({
	className,
	...props
}: ComponentProps<typeof Button>) {
	return (
		<Button
			className={cn("w-full rounded-xl py-3 text-base", className)}
			{...props}
		/>
	);
}

export function SecondaryButton({
	className,
	...props
}: ComponentProps<typeof Button>) {
	return (
		<Button
			className={cn("w-full rounded-xl py-3 text-base", className)}
			variant="outline"
			{...props}
		/>
	);
}

export function DangerButton({
	className,
	...props
}: ComponentProps<typeof Button>) {
	return (
		<Button
			className={cn(
				"w-full rounded-xl bg-destructive py-3 text-base text-white hover:bg-destructive/90",
				className
			)}
			{...props}
		/>
	);
}

export function ModalTitle({
	className,
	...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			className={cn(
				"font-semibold text-[28px] text-grey-800 leading-9",
				className
			)}
			{...props}
		/>
	);
}

export function useNameField(open: boolean, initial: string) {
	const [name, setName] = useState(initial);
	useEffect(() => {
		if (open) setName(initial);
	}, [open, initial]);
	return [name, setName] as const;
}

export function ModalHeader({
	title,
	description
}: {
	title: React.ReactNode;
	description?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<ModalTitle>{title}</ModalTitle>
			{description && (
				<p className="text-[16px] text-grey-600 leading-6">{description}</p>
			)}
		</div>
	);
}

export function ErrorText({
	children,
	className
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<p className={cn("font-medium text-[14px] text-red-700", className)}>
			{children}
		</p>
	);
}

type ModalAction = {
	label: string;
	loadingLabel?: string;
	onClick: () => void;
	disabled?: boolean;
	loading?: boolean;
};

export function ActionModal({
	open,
	onClose,
	showClose,
	title,
	description,
	error,
	errorClassName,
	danger,
	primary,
	secondary,
	children
}: {
	open: boolean;
	onClose: () => void;
	showClose?: boolean;
	title: React.ReactNode;
	description?: React.ReactNode;
	error?: string | null;
	errorClassName?: string;
	danger?: boolean;
	primary: ModalAction;
	secondary?: { label: string; onClick: () => void };
	children?: React.ReactNode;
}) {
	const Confirm = danger ? DangerButton : PrimaryButton;
	return (
		<Modal onClose={onClose} open={open} showClose={showClose}>
			<ModalHeader description={description} title={title} />
			{children}
			{error && <ErrorText className={errorClassName}>{error}</ErrorText>}
			<div className="flex flex-col gap-3">
				<Confirm
					disabled={primary.disabled || primary.loading}
					onClick={primary.onClick}
					type="button"
				>
					{primary.loading ? primary.loadingLabel : primary.label}
				</Confirm>
				{secondary && (
					<SecondaryButton onClick={secondary.onClick} type="button">
						{secondary.label}
					</SecondaryButton>
				)}
			</div>
		</Modal>
	);
}

export function Modal({
	open,
	onClose,
	showClose = true,
	children
}: {
	open: boolean;
	onClose: () => void;
	showClose?: boolean;
	children: React.ReactNode;
}) {
	return (
		<Dialog onOpenChange={(next) => !next && onClose()} open={open}>
			<DialogPortal>
				<DialogOverlay className="bg-black/40" />
				<DialogPrimitive.Popup
					className={cn(
						"-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-full max-w-[480px] flex-col gap-6 overflow-y-auto rounded-[20px] bg-grey-50 p-6 shadow-elevation-200 outline-none sm:p-8",
						showClose && "pt-16 sm:pt-16"
					)}
					data-slot="dialog-content"
				>
					{children}
					{showClose && (
						<DialogPrimitive.Close
							render={
								<Button
									className="absolute top-5 right-5 rounded-full text-grey-800 hover:bg-grey-100"
									size="icon"
									variant="ghost"
								/>
							}
						>
							<CloseIcon className="size-5" />
							<span className="sr-only">Close</span>
						</DialogPrimitive.Close>
					)}
				</DialogPrimitive.Popup>
			</DialogPortal>
		</Dialog>
	);
}
