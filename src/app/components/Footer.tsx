import Image from "next/image";
import Link from "next/link";

export default function Footer() {
	const ICON_DIMENSION = 30;
	return (
		<footer className="w-full bg-awesome-purple py-4">
			<div className="flex flex-col items-center gap-3.5">
				<p className="font-bold text-awesomer-purple text-xl">
					Keep up with us!
				</p>
				<Link
					className="underline! font-medium! !hover:text-awesome-purple text-base text-medium-grey! leading-5 transition-colors"
					href="https://hack-the-change-2024.devpost.com/project-gallery"
				>
					View 2024 Winners!
				</Link>
				<div className="flex items-center gap-8">
					<Link
						href="https://www.facebook.com/CodeTheChangeYYC/"
						target="_blank"
					>
						<Image
							alt="Facebook"
							height={ICON_DIMENSION}
							src="/svgs/socialIcons/facebook_icon.svg"
							width={ICON_DIMENSION}
						/>
					</Link>
					<Link
						href="https://www.instagram.com/codethechangeyyc/"
						target="_blank"
					>
						<Image
							alt="Instagram"
							height={ICON_DIMENSION}
							src="/svgs/socialIcons/instagram_icon.svg"
							width={ICON_DIMENSION}
						/>
					</Link>
					<Link
						href="https://www.linkedin.com/company/code-the-change-yyc/"
						target="_blank"
					>
						<Image
							alt="LinkedIn"
							height={ICON_DIMENSION}
							src="/svgs/socialIcons/linkedin_icon.svg"
							width={ICON_DIMENSION}
						/>
					</Link>
					<Link
						href="https://www.youtube.com/channel/UC4wZt-bCL31HjxUF-zc5U_g"
						target="_blank"
					>
						<Image
							alt="YouTube"
							height={ICON_DIMENSION}
							src="/svgs/socialIcons/youtube_icon.svg"
							width={ICON_DIMENSION}
						/>
					</Link>
					<Link href="https://github.com/Code-the-Change-YYC" target="_blank">
						<Image
							alt="GitHub"
							height={ICON_DIMENSION}
							src="/svgs/socialIcons/github_icon.svg"
							width={ICON_DIMENSION}
						/>
					</Link>
				</div>

				<p className="pb-10 font-medium text-base text-dashboard-grey/70 leading-5 sm:pb-0">
					Copyright © Code The Change YYC
				</p>
			</div>
		</footer>
	);
}
