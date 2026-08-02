import type { Criterion } from "@/types/landingPage";

export const criteria: Criterion[] = [
	{
		category: "Innovation & Creativity",
		description:
			"Is the idea original or a fresh take on existing solutions? Does it creatively apply technology to urban challenges (e.g., housing, mobility, disaster resilience, inclusivity)?"
	},
	{
		category: "Impact & Relevance to Prompt",
		description:
			"Does the solution clearly address the challenge? Could it meaningfully improve lives?"
	},
	{
		category: "Feasibility & Scalability",
		description:
			"Is the solution practical given real constraints (budget, infrastructure, etc.)? Could it scale beyond a demo into a real city/community setting?"
	},
	{
		category: "Technical Execution",
		description:
			"Quality of the implementation (working prototype, technical depth, stability)? Use of appropriate technology stack. Is the solution technically sound and well-built?"
	},
	{
		category: "User Experience & Design",
		description:
			"Is the solution intuitive, accessible and user-friendly? Is the solution aesthetically pleasing? Does the design of the product elevate its function and original idea?"
	}
];
