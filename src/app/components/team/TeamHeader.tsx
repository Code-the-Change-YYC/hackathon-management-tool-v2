import Image from "next/image";
import Link from "next/link";
import ProfileDropdown from "./ProfileDropdown";

interface TeamHeaderProps {
	breadcrumbLabel?: string;
	userName?: string;
}

export default function TeamHeader({
	breadcrumbLabel,
	userName
}: TeamHeaderProps) {
	return (
		<header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-white px-4 shadow-sm sm:px-6">
			{/* Left: breadcrumb label or spacer */}
			<div className="w-28 sm:w-36">
				{breadcrumbLabel && (
					<Link
						className="font-semibold text-awesomer-purple text-sm transition hover:text-awesome-purple sm:text-base"
						href="/team"
					>
						{breadcrumbLabel}
					</Link>
				)}
			</div>

			{/* Center: CTC Logo */}
			<Link className="shrink-0" href="/">
				<Image
					alt="Code the Change YYC"
					className="h-10 w-auto"
					height={40}
					priority
					src="/svgs/CTCLogo.svg"
					width={40}
				/>
			</Link>

			{/* Right: profile dropdown */}
			<div className="flex w-28 justify-end sm:w-36">
				<ProfileDropdown userName={userName} />
			</div>
		</header>
	);
}
