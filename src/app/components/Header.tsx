import Image from "next/image";
import Link from "next/link";
import type { HeaderProps } from "@/types/landingPage";

//TODO: Fix Sign In logic (add profile pic when signed in)

export default function Header({ isSignedIn, hasTeam }: HeaderProps) {
	return (
		<header className="relative w-full bg-white shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]">
			<div className="flex items-center justify-between px-[88px] py-[40px]">
				<div className="min-w-[100px]">
					{!isSignedIn && (
						<Link
							className="!text-awesomer-purple hover:!text-awesome-purple font-semibold text-2xl transition-colors"
							href="/register"
						>
							Join Hackathon
						</Link>
					)}
					{isSignedIn && !hasTeam && (
						<Link
							className="!text-awesomer-purple hover:!text-awesome-purple font-semibold text-2xl transition-colors"
							href="/teams"
						>
							Join a Team
						</Link>
					)}
				</div>

				<div className="-translate-x-1/2 absolute left-1/2">
					<Image
						alt="CTC logo"
						height={70}
						src="/svgs/CTCLogo.svg"
						width={70}
					/>
				</div>

				<div className="flex min-w-[100px] justify-end">
					<Link
						className="!text-awesomer-purple hover:!text-awesome-purple font-semibold text-2xl transition-colors"
						href="/login"
					>
						Sign In
					</Link>
				</div>
			</div>
		</header>
	);
}
