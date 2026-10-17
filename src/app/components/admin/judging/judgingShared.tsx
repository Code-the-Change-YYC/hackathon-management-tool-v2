import type { ReactNode } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader
} from "@/app/components/ui/card";
import type { RouterInputs, RouterOutputs } from "@/trpc/react";

export type Round = RouterOutputs["judgingRounds"]["getAll"][number];
export type Assignment = RouterOutputs["judgingAssignments"]["getAll"][number];
export type Room =
	RouterOutputs["judgingRooms"]["getLayoutByRound"]["rooms"][number];
// Each round's rooms, by round ID.
export type RoomLayouts = Record<string, Room[]>;
export type Judge = RouterOutputs["users"]["getAll"][number];
export type Team = RouterOutputs["teams"]["getAll"][number];
export type Criterion = RouterOutputs["criteria"]["getAll"][number];
export type Ranking = RouterOutputs["teams"]["getRankings"][number];

export type LayoutInput =
	RouterInputs["judgingRooms"]["saveLayoutByRound"]["layout"];
export type LayoutRoomInput = NonNullable<LayoutInput["rooms"]>[number];

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
					<h2 className="font-medium text-xl">{title}</h2>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent>{children}</CardContent>
			</Card>
		</section>
	);
}
