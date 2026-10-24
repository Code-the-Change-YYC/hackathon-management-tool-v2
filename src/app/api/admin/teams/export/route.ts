import { auth } from "@/server/better-auth";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

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

	const teams = await api.teams.getTeamsWithMembers();

	const rows = [
		[
			"Rank",
			"ID",
			"Team Name",
			"Prescreen",
			"Round1",
			"Round2",
			"Feedback",
			"Members",
			"Member Count"
		],
		...teams.map((team) => [
			team.rank,
			team.id,
			team.name,
			team.prescreen,
			team.round1,
			team.round2,
			team.feedback,
			team.members,
			team.memberCount
		])
	];

	return new Response(`\uFEFF${toCsv(rows)}`, {
		headers: {
			"Cache-Control": "no-store",
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": 'attachment; filename="teams.csv"'
		}
	});
}
