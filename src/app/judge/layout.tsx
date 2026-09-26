import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";
import { JudgeUserProvider } from "../components/judges/JudgeUserProvider";
import type { NavGroup } from "../components/layout/AppSidebar";
import {
	AppSidebar,
	AppSidebarTriggerHeader
} from "../components/layout/AppSidebar";

export default async function JudgeLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	const session = await requireRole([Role.JUDGE, Role.ADMIN]);

	if (!session.user?.id) {
		redirect("/");
	}

	const userName = session.user.name || "Judge";

	const JUDGE_NAV_GROUPS: NavGroup[] = [
		{
			groupLabel: "Judging Information",
			items: [
				{ title: "Dashboard", href: "/judge", icon: "home" },
				{ title: "Schedule", href: "/judge/schedule", icon: "calendar" },
				{ title: "Rubric", href: "/judge/rubric", icon: "task" }
			]
		}
	];

	return (
		<SidebarProvider>
			<AppSidebar navGroups={JUDGE_NAV_GROUPS} userName={userName} />
			<SidebarInset>
				<AppSidebarTriggerHeader />
				<JudgeUserProvider userId={session.user.id} userName={userName}>
					{children}
				</JudgeUserProvider>
			</SidebarInset>
		</SidebarProvider>
	);
}
