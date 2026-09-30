import type { ReactNode } from "react";

interface PageHeaderProps {
	title: ReactNode;
	description?: string;
	variant?: "default" | "dashboard";
}

export default function PageHeader({
	title,
	description,
	variant = "default"
}: PageHeaderProps) {
	return (
		<div className="flex flex-col gap-1">
			<h1
				className={
					variant === "dashboard"
						? "font-semibold text-[32px]/10"
						: "font-semibold text-2xl md:text-3xl"
				}
			>
				{title}
			</h1>
			{description && (
				<p
					className={
						variant === "dashboard"
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
