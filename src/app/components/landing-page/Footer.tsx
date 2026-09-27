import {
	FacebookFill,
	GithubFill,
	InstagramFill,
	LinkedinFill,
	YoutubeFill
} from "@mingcute/react";
import Link from "next/link";
import type { MingCuteIcon } from "@/types/landingPage";

const SOCIAL_LINKS: { label: string; href: string; icon: MingCuteIcon }[] = [
	{
		label: "Facebook",
		href: "https://www.facebook.com/CodeTheChangeYYC/",
		icon: FacebookFill
	},
	{
		label: "Instagram",
		href: "https://www.instagram.com/codethechangeyyc/",
		icon: InstagramFill
	},
	{
		label: "LinkedIn",
		href: "https://www.linkedin.com/company/code-the-change-yyc/",
		icon: LinkedinFill
	},
	{
		label: "YouTube",
		href: "https://www.youtube.com/channel/UC4wZt-bCL31HjxUF-zc5U_g",
		icon: YoutubeFill
	},
	{
		label: "GitHub",
		href: "https://github.com/Code-the-Change-YYC",
		icon: GithubFill
	}
];

export default function Footer() {
	return (
		<footer className="w-full bg-awesomer-purple px-6 py-10 text-white">
			<div className="flex flex-col items-center gap-4 text-center">
				<p className="font-bold text-xl">Keep up with us!</p>
				<Link
					className="font-medium text-base text-white/90! underline transition-colors hover:text-white!"
					href="https://hack-the-change-2024.devpost.com/project-gallery"
					rel="noopener noreferrer"
					target="_blank"
				>
					View 2024 Winners!
				</Link>
				<div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
					{SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
						<Link
							aria-label={label}
							className="text-white! transition-opacity hover:opacity-75"
							href={href}
							key={label}
							rel="noopener noreferrer"
							target="_blank"
						>
							<Icon aria-hidden="true" size={30} />
						</Link>
					))}
				</div>

				<p className="font-medium text-sm text-white/80">
					Copyright © Code The Change YYC
				</p>
			</div>
		</footer>
	);
}
