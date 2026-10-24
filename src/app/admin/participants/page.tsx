import type { Metadata } from "next";
import { RegisteredUsersView } from "@/app/components/admin/participants/RegisteredUsersView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Users | Hack the Change"
};

export default async function AdminParticipantsPage() {
	await requireRole([Role.ADMIN]);

	const participants = await api.users.getUserWithTeam();

	return <RegisteredUsersView participants={participants} />;
}
