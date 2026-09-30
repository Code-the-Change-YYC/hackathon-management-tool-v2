import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
	title: ReactNode;
	description?: string;
	variant?: "default" | "dashboard" | "schedule";
}

export default function PageHeader({
	title,
	description,
	variant = "default"
}: PageHeaderProps) {
	return (
		<div className={cn("flex flex-col", variant !== "schedule" && "gap-1")}>
			<h1
				className={
					variant !== "default"
						? "font-semibold text-[32px]/10"
						: "font-semibold text-2xl md:text-3xl"
				}
			>
				{title}
			</h1>
			{description && (
				<p
					className={
						variant === "schedule"
							? "text-base/6 text-grey-600"
							: variant === "dashboard"
								? "text-grey-600 text-sm/5 sm:text-base/6"
								: "text-muted-foreground text-sm"
					}
				>
					{description}
				</p>
			)}
		</div>
	);
}
