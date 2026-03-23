import Image from "next/image";
import Link from "next/link";

type HeaderProps = {
	isSignedIn: boolean;
	hasTeam: boolean;
};

export default function Header({ isSignedIn, hasTeam }: HeaderProps) {
	return (
		<header className="relative w-full border-light-grey border-b bg-white shadow-sm">
			<div className="mx-auto flex w-full max-w-screen-2x1 items-center px-6 py-5">
				<div className="min-w-25 text-awesomer-purple hover:text-awesome-purple">
					{!isSignedIn && (
						<Link className="text-sm transition-colors" href="#">
							Join Hackathon
						</Link>
					)}
					{isSignedIn && !hasTeam && (
						<Link className="text-sm transition-colors" href="#">
							Join a Team
						</Link>
					)}
				</div>

				<div className="-translate-x-1/2 absolute left-1/2">
					<Image
						alt="CTC logo"
						height={40}
						src="/svgs/CTCLogo.svg"
						width={40}
					/>
				</div>

				<div className="flex min-w-[100px] justify-end">
					{/* Add profile pic */}
				</div>
			</div>
		</header>
	);
}
