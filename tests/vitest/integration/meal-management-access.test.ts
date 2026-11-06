import { expect, it, onTestFinished } from "vitest";
import { Role } from "@/types/types";
import {
	createAuthenticatedCaller,
	createUnauthenticatedCaller
} from "../helpers/auth";

it.each([
	Role.PARTICIPANT,
	Role.JUDGE,
	null
])("HMTV2-58: %s cannot manage meals or acquire a scanner lease", async (role) => {
	const account = role ? await createAuthenticatedCaller({ role }) : null;
	if (account) onTestFinished(account.cleanup);
	const caller = account?.caller ?? createUnauthenticatedCaller();
	const code = role ? "FORBIDDEN" : "UNAUTHORIZED";
	await expect(
		caller.meals.addMeal({
			title: "Unauthorized meal",
			description: "Must not be created",
			startTime: new Date(),
			endTime: new Date(Date.now() + 60_000)
		})
	).rejects.toMatchObject({ code });
	await expect(caller.meals.getAllMeals()).rejects.toMatchObject({ code });
	await expect(
		caller.meals.beginMealScan({ eventId: crypto.randomUUID() })
	).rejects.toMatchObject({ code });
});
