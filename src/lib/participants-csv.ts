import {
	type Participant,
	ROLE_LABELS
} from "@/app/components/admin/users/types";
import { formatShortDate } from "@/lib/datetime";

const HEADERS = [
	"First Name",
	"Last Name",
	"Email",
	"Role",
	"Team Name",
	"Sign-up Date",
	"Email Verified",
	"Completed Registration",
	"Institution",
	"Major",
	"Registered for Food"
];

function yesNo(value: boolean | null) {
	if (value === null) return "N/A";
	return value ? "Yes" : "No";
}

// Spreadsheet apps run cells that start with these characters as formulas.
function escapeCsvCell(value: string | null) {
	let text = value ?? "";

	if (/^[=+\-@]/.test(text)) {
		text = `'${text}`;
	}

	return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(participants: Participant[]) {
	const rows = [
		HEADERS,
		...participants.map((participant) => [
			participant.firstName,
			participant.lastName,
			participant.email,
			participant.role ? ROLE_LABELS[participant.role] : "",
			participant.teamName,
			formatShortDate(participant.signedUpAt),
			yesNo(participant.emailVerified),
			yesNo(participant.completedRegistration),
			participant.institution,
			participant.major,
			yesNo(participant.registeredForFood)
		])
	];

	return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

export function downloadParticipantsCsv(participants: Participant[]) {
	// The byte order mark makes Excel read the file as UTF-8.
	const blob = new Blob([`﻿${toCsv(participants)}`], {
		type: "text/csv;charset=utf-8"
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");

	link.href = url;
	link.download = "users.csv";
	link.click();
	URL.revokeObjectURL(url);
}
