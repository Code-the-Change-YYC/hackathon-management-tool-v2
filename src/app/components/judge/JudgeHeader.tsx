"use client";

import { ExitLine } from "@mingcute/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import HackathonLogo from "@/app/components/sidebar/HackathonLogo";
import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";
import { getInitials } from "@/lib/names";
import { authClient } from "@/server/better-auth/client";

export function JudgeHeader({
	userName,
	avatarUrl
}: {
	userName: string;
	avatarUrl?: string;
}) {
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
		<header className="border-b bg-white">
			<div className="mx-auto flex h-18 items-center justify-between gap-4 px-6">
				<Link className="rounded-lg" href="/judge">
					<HackathonLogo />
				</Link>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								className="h-10 min-w-0 gap-2 rounded-full px-1.5 hover:bg-accent focus:bg-accent active:bg-accent sm:pr-2"
								variant="ghost"
							/>
						}
					>
						<Avatar className="size-7">
							{avatarUrl && <AvatarImage alt="" src={avatarUrl} />}
							<AvatarFallback className="bg-primary text-primary-foreground">
								{getInitials(userName)}
							</AvatarFallback>
						</Avatar>
						<span className="sr-only truncate font-medium text-base sm:not-sr-only">
							{userName}
						</span>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="rounded-xl p-1"
						sideOffset={8}
					>
						<DropdownMenuGroup>
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
			</div>
		</header>
	);
}
