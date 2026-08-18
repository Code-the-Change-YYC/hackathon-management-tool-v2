"use server";

import { tryCatch } from "@/lib/utils";
import { fetchContentful } from "@/server/contentful";
import { mapJudges } from "./components/admin/landingpage/data/judges";
import { mapPastHackathonWinners } from "./components/admin/landingpage/data/winners";

export async function getWinners() {
	const { data, error } = await tryCatch(
		fetchContentful("pastHackathonWinner")
	);
	if (!data) {
		if (error) {
			console.error("Error fetching past hackathon winners:", error);
		}
		return [];
	}
	return mapPastHackathonWinners(data);
}

export async function getJudges() {
	const { data, error } = await tryCatch(fetchContentful("hackathonJudge"));
	if (!data) {
		if (error) {
			console.error("Error fetching public judges:", error);
		}
		return [];
	}

	return mapJudges(data);
}
