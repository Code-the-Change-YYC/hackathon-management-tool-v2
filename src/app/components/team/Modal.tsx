"use client";

import { useEffect } from "react";
import { CloseIcon } from "@/app/components/layout/icons";

export const primaryButtonClass =
	"flex w-full items-center justify-center rounded-xl bg-purple-500 px-4 py-3 font-medium text-[16px] text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
	"flex w-full items-center justify-center rounded-xl border border-grey-300 bg-grey-00 px-4 py-3 font-medium text-[16px] text-grey-800 transition hover:bg-grey-100";

export const dangerButtonClass =
	"flex w-full items-center justify-center rounded-xl bg-orange-800 px-4 py-3 font-medium text-[16px] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

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
	useEffect(() => {
		if (!open) {
			return;
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") {
				onClose();
			}
		}
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	if (!open) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				aria-label="Close"
				className="absolute inset-0 bg-black/40"
				onClick={onClose}
				type="button"
			/>
			<div
				aria-modal="true"
				className="relative flex w-full max-w-[480px] flex-col gap-6 rounded-[20px] bg-grey-50 p-6 shadow-elevation-200 sm:p-8"
				role="dialog"
			>
				{showClose && (
					<button
						aria-label="Close"
						className="absolute top-4 right-4 grid size-8 place-items-center rounded-full text-grey-800 transition hover:bg-grey-100"
						onClick={onClose}
						type="button"
					>
						<CloseIcon className="size-5" />
					</button>
				)}
				{children}
			</div>
		</div>
	);
}
