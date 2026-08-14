"use server";

import { tryCatch } from "@/lib/utils";
import { fetchContentful } from "@/server/contentful";
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
