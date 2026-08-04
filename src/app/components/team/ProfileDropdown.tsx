"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";
import { authClient } from "@/server/better-auth/client";

interface ProfileDropdownProps {
	userName?: string;
}

const PersonIcon = () => (
	<svg
		aria-hidden="true"
		fill="currentColor"
		height="18"
		viewBox="0 0 24 24"
		width="18"
	>
		<path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
	</svg>
);

const MealIcon = () => (
	<svg
		aria-hidden="true"
		fill="currentColor"
		height="18"
		viewBox="0 0 24 24"
		width="18"
	>
		<path d="M21.41 11.58l-9-9A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 .59 1.42l9 9A2 2 0 0 0 13 22a2 2 0 0 0 1.41-.59l7-7A2 2 0 0 0 22 13a2 2 0 0 0-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
	</svg>
);

const TeamMenuIcon = () => (
	<svg
		aria-hidden="true"
		fill="currentColor"
		height="18"
		viewBox="0 0 24 24"
		width="18"
	>
		<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
	</svg>
);

const LogoutIcon = () => (
	<svg
		aria-hidden="true"
		fill="currentColor"
		height="18"
		viewBox="0 0 24 24"
		width="18"
	>
		<path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
	</svg>
);

export default function ProfileDropdown({ userName }: ProfileDropdownProps) {
	const router = useRouter();

	async function handleSignOut() {
		await authClient.signOut();
		router.push("/login");
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label="Profile menu"
				className="flex size-9 items-center justify-center overflow-hidden rounded-full transition hover:opacity-80 sm:size-10"
			>
				<Avatar size="lg">
					<AvatarFallback className="bg-medium-grey text-foreground">
						<PersonIcon />
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="min-w-[220px] rounded-xl bg-primary p-0 text-primary-foreground"
			>
				<DropdownMenuLabel className="flex items-center gap-3 px-4 py-3 font-bold text-base text-primary-foreground">
					<Avatar>
						<AvatarFallback className="bg-medium-grey text-foreground">
							<PersonIcon />
						</AvatarFallback>
					</Avatar>
					{userName ?? "Full Name"}
				</DropdownMenuLabel>

				<DropdownMenuSeparator className="bg-primary/30" />

				<DropdownMenuItem
					className="gap-3 rounded-none px-4 py-3 font-semibold text-base text-primary-foreground focus:bg-primary/20 focus:text-primary-foreground"
					render={<Link href="/participant" />}
				>
					<PersonIcon />
					Profile
				</DropdownMenuItem>
				<DropdownMenuItem
					className="gap-3 rounded-none px-4 py-3 font-semibold text-base text-primary-foreground focus:bg-primary/20 focus:text-primary-foreground"
					render={<Link href="/meal" />}
				>
					<MealIcon />
					Food Ticket
				</DropdownMenuItem>
				<DropdownMenuItem
					className="gap-3 rounded-none px-4 py-3 font-semibold text-base text-primary-foreground focus:bg-primary/20 focus:text-primary-foreground"
					render={<Link href="/team" />}
				>
					<TeamMenuIcon />
					Team Details
				</DropdownMenuItem>

				<DropdownMenuSeparator className="bg-primary/30" />

				<DropdownMenuItem
					className="gap-3 rounded-none px-4 py-3 font-semibold text-base text-primary-foreground focus:bg-primary/20 focus:text-primary-foreground"
					onClick={handleSignOut}
				>
					<LogoutIcon />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
