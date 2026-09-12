import type { ReactNode } from "react";

export function PageHeader({
	children,
	description,
	title
}: {
	children?: ReactNode;
	description: string;
	title: ReactNode;
}) {
	return (
		<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<h1 className="m-0 font-semibold text-3xl leading-10">{title}</h1>
				<p className="m-0 text-muted-foreground text-sm leading-5">
					{description}
				</p>
			</div>
			{children}
		</header>
	);
}
