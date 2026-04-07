import Image from "next/image";
import Link from "next/link";

export default function Footer() {
	var iconDimension = 25;
	return (
		<footer className="w-full bg-awesome-purple py-5">
			<div className="flex flex-col items-center gap-4">
				<p className="font-bold text-sm text-white">Keep up with us!</p>

				<div className="flex items-center gap-5">
					<Link href="https://facebook.com" target="_blank">
						<Image
							alt="Facebook"
							height={iconDimension}
							src="/svgs/facebook.svg"
							width={iconDimension}
						/>
					</Link>
					<Link href="https://instagram.com" target="_blank">
						<Image
							alt="Instagram"
							height={iconDimension}
							src="/svgs/instagram.svg"
							width={iconDimension}
						/>
					</Link>
					<Link href="https://linkedin.com" target="_blank">
						<Image
							alt="LinkedIn"
							height={iconDimension}
							src="/svgs/linkedin.svg"
							width={iconDimension}
						/>
					</Link>
					<Link href="https://youtube.com" target="_blank">
						<Image
							alt="YouTube"
							height={iconDimension}
							src="/svgs/youtube.svg"
							width={iconDimension}
						/>
					</Link>
					<Link href="https://github.com" target="_blank">
						<Image
							alt="GitHub"
							height={iconDimension}
							src="/svgs/github.svg"
							width={iconDimension}
						/>
					</Link>
				</div>

				<p className="text-dashboard-grey/70 text-sm">
					Copyright © Code The Change YYC
				</p>
			</div>
		</footer>
	);
}
