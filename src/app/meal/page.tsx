"use client";

import { useState } from "react";
import { api } from "@/trpc/react";

export default function MealPage() {
	const [title, setTitle] = useState("");
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");
	const createMeal = api.meals.addMeal.useMutation();

	function handleCreateMeal() {
		createMeal.mutate({ title, startTime, endTime });
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
					<label htmlFor="title">Start time:</label>
					<input
						id="start-time"
						name="start-time"
						onChange={(e) => setStartTime(e.target.value)}
						type="datetime-local"
					/>
					<label htmlFor="title">End time:</label>
					<input
						id="end-time"
						name="end-time"
						onChange={(e) => setEndTime(e.target.value)}
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
			</div>
		</main>
	);
}
