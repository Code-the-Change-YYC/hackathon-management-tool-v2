"use client";

import { Search3Line } from "@mingcute/react";
import { useEffect, useRef, useState } from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput
} from "@/app/components/ui/input-group";
import MealAttendees from "./MealAttendees";
import MealScanner from "./MealScanner";

export default function Meal({
	mealId,
	scannerLease
}: {
	mealId: string;
	scannerLease?: string;
}) {
	const [search, setSearch] = useState("");
	const [scanResult, setScanResult] = useState<{
		userId: string;
		alreadyCheckedIn: boolean;
	} | null>(null);
	const attendeesRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const list = attendeesRef.current;
		if (!list || !scanResult) return;

		if (!scanResult.alreadyCheckedIn) {
			list.scrollTo({ top: 0, behavior: "smooth" });
			return;
		}

		const attendee = Array.from(
			list.querySelectorAll<HTMLLIElement>("[data-attendee-id]")
		).find((row) => row.dataset.attendeeId === scanResult.userId);
		if (attendee) {
			list.scrollTo({
				top:
					list.scrollTop +
					attendee.getBoundingClientRect().top -
					list.getBoundingClientRect().top,
				behavior: "smooth"
			});
		}
	}, [scanResult]);

	return (
		<div className="grid min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-4 lg:grid-cols-2 lg:grid-rows-1 lg:gap-6">
			<div className="h-full min-w-0 rounded-xl border border-light-grey bg-white p-4 sm:p-6">
				<div className="mx-auto w-full max-w-60 overflow-hidden rounded-lg sm:max-w-72 lg:max-w-80">
					<MealScanner
						eventId={mealId}
						onScanResult={(userId, alreadyCheckedIn) => {
							setSearch("");
							setScanResult({ userId, alreadyCheckedIn });
						}}
						scannerLease={scannerLease}
					/>
				</div>
			</div>

			<div className="flex min-h-0 min-w-0 flex-col rounded-xl border border-light-grey bg-white p-4 sm:p-6">
				<div className="mb-3 flex items-center gap-3">
					<h3 className="shrink-0 font-semibold">Attendees</h3>
					<InputGroup className="ml-auto h-9 min-w-0 max-w-52">
						<InputGroupAddon>
							<Search3Line />
						</InputGroupAddon>
						<InputGroupInput
							aria-label="Search attendees by name"
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search name"
							value={search}
						/>
					</InputGroup>
				</div>
				<div className="min-h-0 flex-1 overflow-y-auto pr-1" ref={attendeesRef}>
					<MealAttendees mealId={mealId} search={search} />
				</div>
			</div>
		</div>
	);
}
