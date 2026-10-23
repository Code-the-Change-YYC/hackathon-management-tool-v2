import type { Metadata } from "next";
import { RubricView } from "@/app/components/judge/rubric/RubricView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Rubric | Hack the Change"
};

export default async function RubricPage() {
	await requireRole([Role.JUDGE, Role.ADMIN]);
	const criteria = await api.criteria.getAll();

	return <RubricView criteria={criteria} />;
}
