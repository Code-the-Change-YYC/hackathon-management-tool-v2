import type { ReactNode } from "react";
import { Card, CardContent } from "@/app/components/ui/card";

const HEADING_ID = "personal-information-heading";

export function PersonalInformationCard({
	actions,
	children
}: {
	actions: ReactNode;
	children: ReactNode;
}) {
	return (
		<section aria-labelledby={HEADING_ID} className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h2 className="font-medium text-[22px] leading-7" id={HEADING_ID}>
					Personal Information
				</h2>
				<div className="ml-auto flex items-center gap-2">{actions}</div>
			</div>
			<Card className="py-6">
				<CardContent className="px-6">{children}</CardContent>
			</Card>
		</section>
	);
}
