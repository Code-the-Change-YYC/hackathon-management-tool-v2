import {
	FacebookFill,
	GithubFill,
	InstagramFill,
	LinkedinFill,
	YoutubeFill
} from "@mingcute/react";
import Link from "next/link";

export default function Footer() {
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
						aria-label="Facebook"
						href="https://www.facebook.com/CodeTheChangeYYC/"
						target="_blank"
					>
						<FacebookFill aria-hidden="true" size={30} />
					</Link>
					<Link
						aria-label="Instagram"
						href="https://www.instagram.com/codethechangeyyc/"
						target="_blank"
					>
						<InstagramFill aria-hidden="true" size={30} />
					</Link>
					<Link
						aria-label="LinkedIn"
						href="https://www.linkedin.com/company/code-the-change-yyc/"
						target="_blank"
					>
						<LinkedinFill aria-hidden="true" size={30} />
					</Link>
					<Link
						aria-label="YouTube"
						href="https://www.youtube.com/channel/UC4wZt-bCL31HjxUF-zc5U_g"
						target="_blank"
					>
						<YoutubeFill aria-hidden="true" size={30} />
					</Link>
					<Link
						aria-label="GitHub"
						href="https://github.com/Code-the-Change-YYC"
						target="_blank"
					>
						<GithubFill aria-hidden="true" size={30} />
					</Link>
				</div>

				<p className="pb-10 font-medium text-base text-dashboard-grey/70 leading-5 sm:pb-0">
					Copyright © Code The Change YYC
				</p>
			</div>
		</footer>
	);
}
