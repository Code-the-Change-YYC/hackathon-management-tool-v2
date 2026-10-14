// The MLH badge can be obtained here: https://www.mlh.com/brand-guidelines/?ajs_uid=019fa595-54bc-bff2-202c-7a9822b26120&utm_campaign=Member+Event+-+Onboarding+Reminder&utm_content=Onboarding+Needed&utm_medium=Email&utm_source=Customer.io#trust-badge
// Some styles are modified to ensure it is displayed nicely on our landing page.

import Image from "next/image";

export default function MLHBadge() {
	return (
		<a
			className="fixed top-16 right-5 z-10 block w-[10%] min-w-15 max-w-25 sm:right-8 md:top-22 md:right-12.5"
			href="https://mlh.io/na?utm_source=na-hackathon&utm_medium=TrustBadge&utm_campaign=2026-season&utm_content=white"
			id="mlh-trust-badge"
			rel="noopener noreferrer"
			target="_blank"
		>
			<Image
				alt="Major League Hacking 2026 Hackathon Season"
				className="h-auto w-full"
				height={175}
				src="https://logged-assets.s3.amazonaws.com/trust-badge/2026/mlh-trust-badge-2026-white.svg"
				unoptimized
				width={100}
			/>
		</a>
	);
}
