"use client";

import type { ReactNode } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/app/components/ui/card";
import type { RouterInputs } from "@/trpc/react";

export type LayoutInput =
	RouterInputs["judgingRooms"]["saveLayoutByRound"]["layout"];
export type LayoutRoomInput = NonNullable<LayoutInput["rooms"]>[number];
export type SlotMinutes = 15 | 30 | 60;

export function byNameThenId<T extends { id: string; name: string }>(
	a: T,
	b: T
) {
	const nameSort = a.name.localeCompare(b.name);
	return nameSort || a.id.localeCompare(b.id);
}

export function ManagementSection({
	children,
	description,
	id,
	title
}: {
	children: ReactNode;
	description: string;
	id: string;
	title: string;
}) {
	return (
		<section className="scroll-mt-6" id={id}>
			<Card>
				<CardHeader>
					<CardTitle className="text-[22px] leading-7">{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent>{children}</CardContent>
			</Card>
		</section>
	);
}
