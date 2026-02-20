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
		<main>
			<header>
				<h1>Meal Portal</h1>
			</header>
			<div>
				<div>
					<h2>Create a meal</h2>
					<label htmlFor="title">Title:</label>
					<input
						id="title"
						name="title"
						onChange={(e) => setTitle(e.target.value)}
						type="text"
					/>
					<label htmlFor="start-time">Start time:</label>
					<input
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
					<label htmlFor="end-time">End time:</label>
					<input
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
					<button
						onClick={() => {
							handleCreateMeal();
						}}
						type="button"
					>
						Submit
					</button>
				</div>
				<div>
					<h2>Scan user in for a meal</h2>
					<label htmlFor="meal-id">Meal Id:</label>
					<input
						id="meal-id"
						name="meal-id"
						onChange={(e) => setMealId(e.target.value)}
						type="text"
					/>
					<label htmlFor="user-id">User Id:</label>
					<input
						id="start-time"
						name="start-time"
						onChange={(e) => setUserId(e.target.value)}
						type="text"
					/>
					<button
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
