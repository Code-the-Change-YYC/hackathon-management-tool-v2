"use client";

import { useState } from "react";
import { api } from "@/trpc/react";

export default function CreateMeal() {
	const [title, setTitle] = useState("");
	const [startTime, setStartTime] = useState<Date | null>(null);
	const [endTime, setEndTime] = useState<Date | null>(null);

	const utils = api.useUtils();
	const createMeal = api.meals.addMeal.useMutation({
		onSuccess: async () => {
			await utils.meals.getAllMeals.invalidate(); // re-fetch meals
			setTitle("");
			setStartTime(null);
			setEndTime(null);
		}
	});

	function handleCreateMeal() {
		if (!title.trim() || !startTime || !endTime) return;
		createMeal.mutate({ title: title.trim(), startTime, endTime });
	}

	return (
		<div className="w-full rounded-xl border border-light-grey bg-white p-8 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
			<h2 className="mb-4 font-semibold text-2xl text-grey-purple">
				Create a meal
			</h2>
			<label className="mb-2 block font-medium text-sm" htmlFor="title">
				Title:
			</label>
			<input
				className="mb-4 w-full rounded-lg border border-medium-grey bg-white px-3 py-2 outline-none transition focus:border-awesomer-purple focus:ring-2 focus:ring-awesomer-purple/20"
				id="title"
				name="title"
				onChange={(e) => setTitle(e.target.value)}
				type="text"
				value={title}
			/>
			<label className="mb-2 block font-medium text-sm" htmlFor="start-time">
				Start time:
			</label>
			<input
				className="mb-4 w-full rounded-lg border border-medium-grey bg-white px-3 py-2 outline-none transition focus:border-awesomer-purple focus:ring-2 focus:ring-awesomer-purple/20"
				id="start-time"
				name="start-time"
				onChange={(e) => {
					const nextStartTime = new Date(e.target.value);
					setStartTime(
						Number.isNaN(nextStartTime.getTime()) ? null : nextStartTime
					);
				}}
				type="datetime-local"
			/>
			<label className="mb-2 block font-medium text-sm" htmlFor="end-time">
				End time:
			</label>
			<input
				className="mb-6 w-full rounded-lg border border-medium-grey bg-white px-3 py-2 outline-none transition focus:border-awesomer-purple focus:ring-2 focus:ring-awesomer-purple/20"
				id="end-time"
				name="end-time"
				onChange={(e) => {
					const nextEndTime = new Date(e.target.value);
					setEndTime(Number.isNaN(nextEndTime.getTime()) ? null : nextEndTime);
				}}
				type="datetime-local"
			/>
			<button
				className="rounded-lg bg-awesomer-purple px-4 py-2 font-semibold text-white transition hover:bg-awesome-purple disabled:cursor-not-allowed disabled:opacity-50"
				disabled={createMeal.isPending}
				onClick={handleCreateMeal}
				type="button"
			>
				{createMeal.isPending ? "Submitting..." : "Submit"}
			</button>
		</div>
	);
}
