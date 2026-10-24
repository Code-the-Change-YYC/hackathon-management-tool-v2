"use client";

import { Search3Line } from "@mingcute/react";
import { useState } from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput
} from "@/app/components/ui/input-group";
import MealAttendees from "./MealAttendees";
import MealScanner from "./MealScanner";

export default function Meal({ mealId }: { mealId: string }) {
	const [search, setSearch] = useState("");

	return (
		<div className="grid min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-4 lg:grid-cols-2 lg:grid-rows-1 lg:gap-6">
			<div className="h-full min-w-0 rounded-xl border border-light-grey bg-white p-4 sm:p-6">
				<div className="mx-auto w-full max-w-sm overflow-hidden rounded-lg md:max-w-md lg:max-w-full">
					<MealScanner eventId={mealId} />
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
				<div className="min-h-0 flex-1 overflow-y-auto pr-1">
					<MealAttendees mealId={mealId} search={search} />
				</div>
			</div>
		</div>
	);
}
