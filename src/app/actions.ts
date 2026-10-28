"use server";

import { asc } from "drizzle-orm";

import { tryCatch } from "@/lib/utils";
import { fetchContentful } from "@/server/contentful";
import { db } from "@/server/db";
import { criteria } from "@/server/db/scores-schema";
import type { Mentor, MentorCategory } from "@/types/contentfulTypes";
import { mapJudges } from "./components/landing-page/data/judges";
import { mapPastHackathonWinners } from "./components/landing-page/data/winners";
import { processMentors } from "./components/participant/resources/data/mentors";
import { mapResources } from "./components/participant/resources/data/resources";

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
	const { data, error } = await tryCatch(
		db
			.select()
			.from(criteria)
			.orderBy(asc(criteria.displayOrder), asc(criteria.name))
	);
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

export async function getMentors() {
	const { data, error } = await tryCatch(fetchContentful("hackathonMentor"));
	if (!data) {
		if (error) {
			console.error("Error fetching mentors judges:", error);
		}
		return new Map<MentorCategory, Mentor[]>();
	}

	return processMentors(data);
}

export async function getResources() {
	const { data, error } = await tryCatch(fetchContentful("hackathonResource"));
	if (!data) {
		if (error) {
			console.error("Error fetching mentors judges:", error);
		}
		return [];
	}

	return mapResources(data);
}
