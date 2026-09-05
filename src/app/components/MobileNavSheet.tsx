"use client";

import type { ReactNode } from "react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle
} from "@/app/components/ui/sheet";

export function MobileNavSheet({
	children,
	onOpenChange,
	open,
	title
}: {
	children: ReactNode;
	onOpenChange: (open: boolean) => void;
	open: boolean;
	title: string;
}) {
	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent
				className="w-[280px] gap-0 bg-sidebar p-0 sm:max-w-[280px]"
				showCloseButton
				side="left"
			>
				<SheetHeader className="sr-only">
					<SheetTitle>{title}</SheetTitle>
				</SheetHeader>
				<div className="h-full p-4 pt-12">{children}</div>
			</SheetContent>
		</Sheet>
	);
}
