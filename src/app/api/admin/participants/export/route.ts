import { auth } from "@/server/better-auth";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

function roleLabel(role: string | null) {
	switch (role?.toLowerCase()) {
		case Role.ADMIN:
			return "Admin";
		case Role.JUDGE:
			return "Judge";
		case Role.PARTICIPANT:
			return "Participant";
		default:
			return "";
	}
}

function escapeCsvCell(value: unknown) {
	let text = String(value ?? "");

	if (/^[=+\-@]/.test(text)) {
		text = `'${text}`;
	}

	return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows: readonly (readonly unknown[])[]) {
	return rows
		.map((row) => row.map((value) => escapeCsvCell(value)).join(","))
		.join("\r\n");
}

export async function GET(request: Request) {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	if (session.user.role !== Role.ADMIN) {
		return Response.json({ error: "Forbidden" }, { status: 403 });
	}

	const participants = await api.users.getUserWithTeam();

	const rows = [
		[
			"ID",
			"First Name",
			"Last Name",
			"Email",
			"Role",
			"Team ID",
			"Team Name",
			"Institution",
			"Major",
			"Registered for Food"
		],
		...participants.map((participant) => [
			participant.id,
			participant.firstName,
			participant.lastName,
			participant.email,
			participant.role ? roleLabel(participant.role) : "",
			participant.teamId,
			participant.teamName,
			participant.institution,
			participant.major,
			participant.registeredForFood === true
				? "Yes"
				: participant.registeredForFood === false
					? "No"
					: "N/A"
		])
	];

	return new Response(`\uFEFF${toCsv(rows)}`, {
		headers: {
			"Cache-Control": "no-store",
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": 'attachment; filename="users.csv"'
		}
	});
}
