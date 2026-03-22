"use client";

import { useState } from "react";
import { api } from "@/trpc/react";

export default function MealPage() {
	const [title, setTitle] = useState("");
	const [startTime, setStartTime] = useState<Date | null>(null);
	const [endTime, setEndTime] = useState<Date | null>(null);
	const [mealId, setMealId] = useState("");
	const [userId, setUserId] = useState("");

	const createMeal = api.meals.addMeal.useMutation();
	const scanUserIn = api.meals.scanUserIn.useMutation();

	function handleCreateMeal() {
		if (!startTime || !endTime) return;
		createMeal.mutate({ title, startTime, endTime });
	}

	function handleScanUserIn() {
		scanUserIn.mutate({ mealId, userId });
	}

	return (
		<main className="flex min-h-screen flex-col bg-pale-grey font-sans text-dark-grey">
			<header className="flex items-center justify-between bg-awesomer-purple px-8 py-4 text-white shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
				<h1 className="m-0 font-bold text-2xl">Meal Portal</h1>
				<span className="ml-4 inline-block rounded-full bg-white/20 px-3 py-1 font-semibold text-sm">
					Admin
				</span>
			</header>
			<div className="mx-auto flex w-full max-w-300 flex-col gap-6 p-8">
				<div className="rounded-xl border border-light-grey bg-white p-8 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
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
					/>
					<label
						className="mb-2 block font-medium text-sm"
						htmlFor="start-time"
					>
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
							setEndTime(
								Number.isNaN(nextEndTime.getTime()) ? null : nextEndTime
							);
						}}
						type="datetime-local"
					/>
					{/* TODO: make buttons use loading state after mutations are fired */}
					<button
						className="rounded-lg bg-awesomer-purple px-4 py-2 font-semibold text-white transition hover:bg-awesome-purple"
						onClick={() => {
							handleCreateMeal();
						}}
						type="button"
					>
						Submit
					</button>
				</div>
				<div className="rounded-xl border border-light-grey bg-white p-8 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
					<h2 className="mb-4 font-semibold text-2xl text-grey-purple">
						Scan user in for a meal
					</h2>
					<label className="mb-2 block font-medium text-sm" htmlFor="meal-id">
						Meal Id:
					</label>
					<input
						className="mb-4 w-full rounded-lg border border-medium-grey bg-white px-3 py-2 outline-none transition focus:border-awesomer-purple focus:ring-2 focus:ring-awesomer-purple/20"
						id="meal-id"
						name="meal-id"
						onChange={(e) => setMealId(e.target.value)}
						type="text"
					/>
					<label className="mb-2 block font-medium text-sm" htmlFor="user-id">
						User Id:
					</label>
					<input
						className="mb-6 w-full rounded-lg border border-medium-grey bg-white px-3 py-2 outline-none transition focus:border-awesomer-purple focus:ring-2 focus:ring-awesomer-purple/20"
						id="user-id"
						name="user-id"
						onChange={(e) => setUserId(e.target.value)}
						type="text"
					/>
					<button
						className="rounded-lg bg-awesomer-purple px-4 py-2 font-semibold text-white transition hover:bg-awesome-purple"
						onClick={() => {
							handleScanUserIn();
						}}
						type="button"
					>
						Submit
					</button>
				</div>
			</div>
		</main>
	);
}
