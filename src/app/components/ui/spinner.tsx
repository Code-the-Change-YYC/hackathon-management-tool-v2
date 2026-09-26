import { Loading3Line as SpinnerIcon } from "@mingcute/react";
import type * as React from "react";
import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
	return (
		<SpinnerIcon
			aria-label="Loading"
			className={cn("size-4 animate-spin", className)}
			data-slot="spinner"
			role="status"
			{...props}
		/>
	);
}

export { Spinner };
