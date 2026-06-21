import Image from "next/image";
import Link from "next/link";

export default function Footer() {
	var iconDimension = 25;
	return (
		<footer className="w-full bg-awesome-purple py-5">
			<div className="flex flex-col items-center gap-2">
				<p className="font-bold text-sm text-white">Keep up with us!</p>
				<div className="flex items-center gap-5">
					<Link
						href="https://www.facebook.com/CodeTheChangeYYC/"
						target="_blank"
					>
						<Image
							alt="Facebook"
							height={iconDimension}
							src="/svgs/socialIcons/facebook_icon.svg"
							width={iconDimension}
						/>
					</Link>
					<Link
						href="https://www.instagram.com/codethechangeyyc/?hl=en"
						target="_blank"
					>
						<Image
							alt="Instagram"
							height={iconDimension}
							src="/svgs/socialIcons/instagram_icon.svg"
							width={iconDimension}
						/>
					</Link>
					<Link
						href="linkedin.com/company/codethechangeyyc/?originalSubdomain=ca"
						target="_blank"
					>
						<Image
							alt="LinkedIn"
							height={iconDimension}
							src="/svgs/socialIcons/linkedin_icon.svg"
							width={iconDimension}
						/>
					</Link>
					<Link href="https://youtube.com" target="_blank">
						<Image
							alt="YouTube"
							height={iconDimension}
							src="/svgs/socialIcons/youtube_icon.svg"
							width={iconDimension}
						/>
					</Link>
					<Link href="https://github.com/Code-the-Change-YYC" target="_blank">
						<Image
							alt="GitHub"
							height={iconDimension}
							src="/svgs/socialIcons/github_icon.svg"
							width={iconDimension}
						/>
					</Link>
				</div>

				<p className="pb-10 text-dashboard-grey/70 text-sm">
					Copyright © Code The Change YYC
				</p>
			</div>
		</footer>
	);
}
