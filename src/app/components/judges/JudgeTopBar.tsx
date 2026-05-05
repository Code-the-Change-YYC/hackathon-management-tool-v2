/**
 * Judge portal top bar, logo and profile are still static for now.
 */
import Image from "next/image";

function ProfileIcon() {
	// Vibe coded for now, and easy to swap for a real asset later. Didn't want to install another dependency for this.
	return (
		<svg
			className="size-6 text-dashboard-grey"
			fill="currentColor"
			viewBox="0 0 24 24"
		>
			<title>Profile</title>
			<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" />
		</svg>
	);
}

export default function JudgeTopBar() {
	return (
		<header className="border-medium-grey border-b bg-white px-4 py-3 shadow-sm sm:px-8">
			<div className="relative mx-auto flex max-w-6xl items-center justify-center">
				<div aria-hidden className="flex items-center justify-center">
					<Image
						alt=""
						className="h-8 w-8 object-contain"
						height={32}
						src="/svgs/CTCLogo.svg"
						width={32}
					/>
				</div>
				<div
					aria-hidden
					className="absolute right-0 flex size-9 items-center justify-center rounded-full bg-medium-grey"
				>
					<ProfileIcon />
				</div>
			</div>
		</header>
	);
}
