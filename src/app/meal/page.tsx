"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/trpc/react";

export default function MealPage() {
	const [title, setTitle] = useState("");
	const [startTime, setStartTime] = useState<Date | null>(null);
	const [endTime, setEndTime] = useState<Date | null>(null);

	const createMeal = api.meals.addMeal.useMutation();
	const getAllMeals = api.meals.getAllMeals.useQuery();

	function handleCreateMeal() {
		if (!startTime || !endTime) return;
		createMeal.mutate({ title, startTime, endTime });
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
						Existing meals
					</h2>
					<ul className="space-y-4">
						{getAllMeals.data?.map((m) => (
							<li
								className="rounded-md border border-medium-grey p-4"
								key={m.id}
							>
								<div className="font-semibold">{m.title}</div>
								<div className="text-sm">
									{new Date(m.startTime).toLocaleString()} —{" "}
									{new Date(m.endTime).toLocaleString()}
								</div>
								<div className="flex">
									<Link
										className="ml-auto rounded-lg bg-awesomer-purple px-4 py-2 font-semibold transition hover:bg-awesome-purple"
										href={`/meal/${m.title}/scan`}
									>
										<span className="text-white">Scan</span>
									</Link>
								</div>
							</li>
						))}
					</ul>
				</div>
			</div>
		</main>
	);
}
