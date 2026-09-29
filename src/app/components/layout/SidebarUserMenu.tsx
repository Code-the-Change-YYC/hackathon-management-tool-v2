"use client";

import { ExitLine, User3Line } from "@mingcute/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from "@/app/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem
} from "@/app/components/ui/sidebar";
import { getInitials } from "@/lib/names";
import { authClient } from "@/server/better-auth/client";

type SidebarUserMenuProps = {
	userName: string;
	avatarUrl?: string;
	profileHref?: string;
};

export function SidebarUserMenu({
	userName,
	avatarUrl,
	profileHref
}: SidebarUserMenuProps) {
	const router = useRouter();

	async function logOut() {
		const { error } = await authClient.signOut();
		if (error) {
			toast.error("We couldn't log you out. Try again.");
			return;
		}
		router.push("/");
		router.refresh();
	}

	return (
		<SidebarMenu className="min-w-0 flex-1">
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<SidebarMenuButton className="h-10 cursor-pointer gap-2 rounded-2xl px-1.5" />
						}
					>
						<Avatar className="size-7">
							{avatarUrl && <AvatarImage alt="" src={avatarUrl} />}
							<AvatarFallback className="bg-primary text-primary-foreground">
								{getInitials(userName)}
							</AvatarFallback>
						</Avatar>
						<span className="font-medium text-base">{userName}</span>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-52 rounded-xl p-1">
						<DropdownMenuGroup>
							{profileHref && (
								<DropdownMenuItem
									className="rounded-lg p-2 font-medium"
									render={<Link href={profileHref} />}
								>
									<User3Line />
									Profile
								</DropdownMenuItem>
							)}
							<DropdownMenuItem
								className="rounded-lg p-2 font-medium"
								onClick={logOut}
							>
								<ExitLine />
								Log out
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
