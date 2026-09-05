"use client";

import { useRef, useState } from "react";
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

	const close = (result: boolean) => {
		resolveRef.current?.(result);
		resolveRef.current = null;
		setState(null);
	};

	const confirm = (options: ConfirmOptions) => {
		return new Promise<boolean>((resolve) => {
			resolveRef.current = resolve;
			setState({ ...options, open: true });
		});
	};

	const dialog = (
		<AlertDialog
			onOpenChange={(open) => {
				if (!open) close(false);
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
						onClick={() => close(true)}
						variant={state?.destructive ? "destructive" : "default"}
					>
						{state?.confirmLabel ?? "Continue"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);

	return { confirm, dialog };
}
