import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
	title: ReactNode;
	description?: string;
	className?: string;
	titleClassName?: string;
	descriptionClassName?: string;
}

export default function PageHeader({
	title,
	description,
	className,
	titleClassName,
	descriptionClassName
}: PageHeaderProps) {
	return (
		<div className={cn("flex flex-col gap-1", className)}>
			<h1
				className={cn(
					"font-semibold",
					titleClassName ?? "text-2xl md:text-3xl"
				)}
			>
				{title}
			</h1>
			{description && (
				<p
					className={cn("text-muted-foreground text-sm", descriptionClassName)}
				>
					{description}
				</p>
			)}
		</div>
	);
}
