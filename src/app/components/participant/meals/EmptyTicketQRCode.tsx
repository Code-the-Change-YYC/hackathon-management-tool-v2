import type { IconProps } from "@mingcute/react";
import type { ElementType } from "react";

// Stands in for the QR code when there's no ticket to scan.
export function EmptyTicketQRCode({
	icon: Icon,
	label
}: {
	icon: ElementType<IconProps>;
	label: string;
}) {
	return (
		<div className="relative grid size-full place-items-center">
			<div className="absolute inset-0 flex size-full flex-col items-center justify-center gap-2 rounded-2xl border-4 border-primary/60 border-dashed bg-primary/5 text-awesomer-purple">
				<Icon aria-hidden className="size-8" />

				<span className="rounded-full px-3 py-1 font-medium text-purple-600 text-sm">
					{label}
				</span>
			</div>
		</div>
	);
}
