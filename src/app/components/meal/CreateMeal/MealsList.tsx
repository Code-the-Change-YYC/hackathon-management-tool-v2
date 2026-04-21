"use client";

import Link from "next/link";
import { api } from "@/trpc/react";

export default function MealsList() {
	const getAllMeals = api.meals.getAllMeals.useQuery();

	return (
		<div className="flex w-full flex-col rounded-xl border border-light-grey bg-white p-8 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
			<h2 className="mb-4 min-h-0 flex-1 font-semibold text-2xl text-grey-purple">
				Existing meals
			</h2>
			<ul className="max-h-72 space-y-4 overflow-y-auto pr-2">
				{getAllMeals.data?.map((m) => (
					<li className="rounded-md border border-medium-grey p-4" key={m.id}>
						<h3 className="font-semibold">{m.title}</h3>
						<p className="text-sm">
							{new Date(m.startTime).toLocaleString()} -{" "}
							{new Date(m.endTime).toLocaleString()}
						</p>
						<div className="flex">
							<Link
								className="ml-auto rounded-lg bg-awesomer-purple px-4 py-2 font-semibold transition hover:bg-awesome-purple"
								href={`/meal/${m.id}/scan`}
							>
								<span className="text-white">Scan</span>
							</Link>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}
