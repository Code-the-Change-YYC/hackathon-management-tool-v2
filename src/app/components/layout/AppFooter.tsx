// App-wide footer with copyright and social links.

import { socials } from "./socials";

export default function AppFooter() {
	return (
		<footer className="mt-auto border-grey-300 border-t bg-grey-50 px-6 py-6">
			<div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
				<p className="text-[12px] text-grey-600">
					Copyright &copy; Code The Change YYC
				</p>
				<div className="flex items-center gap-4">
					{socials.map(({ label, href, Icon }) => (
						<a
							className="text-grey-600 transition hover:text-purple-500"
							href={href}
							key={label}
							rel="noopener noreferrer"
							target="_blank"
						>
							<span className="sr-only">{label}</span>
							<Icon className="size-5" />
						</a>
					))}
				</div>
			</div>
		</footer>
	);
}
