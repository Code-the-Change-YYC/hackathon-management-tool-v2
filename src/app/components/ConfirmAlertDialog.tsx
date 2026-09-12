"use client";

import { useEffect, useRef, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from "@/app/components/ui/alert-dialog";

type ConfirmOptions = {
	title: string;
	description: string;
	confirmLabel?: string;
	destructive?: boolean;
};

type ConfirmState = ConfirmOptions & {
	open: boolean;
};

export function useConfirmDialog() {
	const [state, setState] = useState<ConfirmState | null>(null);
	const resolveRef = useRef<((value: boolean) => void) | null>(null);

	useEffect(
		() => () => {
			resolveRef.current?.(false);
			resolveRef.current = null;
		},
		[]
	);

	const close = (result: boolean) => {
		resolveRef.current?.(result);
		resolveRef.current = null;
		setState(null);
	};

	const confirm = (options: ConfirmOptions) => {
		if (resolveRef.current) return Promise.resolve(false);
		return new Promise<boolean>((resolve) => {
			resolveRef.current = resolve;
			setState({ ...options, open: true });
		});
	};

	return { confirm, dialogProps: { state, onClose: close } };
}

export function ConfirmAlertDialog({
	state,
	onClose
}: {
	state: ConfirmState | null;
	onClose: (confirmed: boolean) => void;
}) {
	return (
		<AlertDialog
			onOpenChange={(open) => {
				if (!open) onClose(false);
			}}
			open={Boolean(state?.open)}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{state?.title}</AlertDialogTitle>
					<AlertDialogDescription>{state?.description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => onClose(true)}
						variant={state?.destructive ? "destructive" : "default"}
					>
						{state?.confirmLabel ?? "Continue"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
