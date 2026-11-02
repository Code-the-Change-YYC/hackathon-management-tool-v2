"use server";

import { tryCatch } from "@/lib/utils";
import { getParticipantCriteria } from "@/server/api/participant-judging";
import { fetchContentful } from "@/server/contentful";
import { db } from "@/server/db";
import { mapJudges } from "./components/landing-page/data/judges";
import { mapPastHackathonWinners } from "./components/landing-page/data/winners";

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
export async function getCriteria() {
	const { data, error } = await tryCatch(getParticipantCriteria(db));
	if (!data) {
		if (error) {
			console.error("Error fetching judging criteria:", error);
		}
		return [];
	}
	return data;
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
