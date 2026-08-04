"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";
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
