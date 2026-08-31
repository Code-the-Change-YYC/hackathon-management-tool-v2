// App-wide footer with copyright and social links.

import { socials } from "./socials";

function SocialIcon({ path }: { path: string }) {
	return (
		<svg
			aria-hidden="true"
			fill="currentColor"
			height="20"
			viewBox="0 0 24 24"
			width="20"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d={path} />
		</svg>
	);
}

export default function AppFooter() {
	return (
		<footer className="mt-auto border-grey-300 border-t bg-grey-50 px-6 py-6">
			<div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
				<p className="text-[12px] text-grey-600">
					Copyright &copy; Code The Change YYC
				</p>
				<div className="flex items-center gap-4">
					{socials.map(({ label, href, path }) => (
						<a
							className="text-grey-600 transition hover:text-purple-500"
							href={href}
							key={label}
							rel="noopener noreferrer"
							target="_blank"
						>
							<span className="sr-only">{label}</span>
							<SocialIcon path={path} />
						</a>
					))}
				</div>
			</div>
		</footer>
	);
}
