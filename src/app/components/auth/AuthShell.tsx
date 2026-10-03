import Image from "next/image";

/**
 * Frame shared by the auth and onboarding screens: the illustration fills the
 * page, with the form in a panel pinned left on desktop and a floating card on
 * smaller screens.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative isolate flex min-h-svh items-center justify-center px-4 py-8 lg:items-stretch lg:justify-start lg:p-0">
			<div className="-z-10 fixed inset-0">
				<Image
					alt=""
					className="object-cover"
					fill
					preload
					sizes="100vw"
					src="/images/auth-background.webp"
				/>
			</div>
			<main className="theme-auth flex w-full max-w-160 flex-col gap-6 rounded-xl bg-background px-6 py-12 text-foreground shadow-elevation-500 sm:px-20 lg:min-h-svh lg:w-160 lg:max-w-none lg:rounded-l-none lg:shadow-md">
				<Image
					alt="Code the Change YYC"
					className="self-center"
					height={90}
					preload
					src="/svgs/CTCLogoWithText.svg"
					width={173}
				/>
				{children}
			</main>
		</div>
	);
}

export function AuthHeading({ children }: { children: React.ReactNode }) {
	return <h1 className="font-semibold text-[28px] leading-9">{children}</h1>;
}
