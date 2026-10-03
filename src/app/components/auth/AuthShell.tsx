import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AuthShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative isolate flex min-h-svh items-center justify-center px-4 py-8 lg:h-svh lg:items-stretch lg:justify-start lg:p-0">
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
			<main className="theme-auth lg:no-scrollbar wrap-anywhere flex w-full max-w-150 flex-col gap-6 rounded-2xl bg-background px-6 pt-6 pb-12 text-foreground shadow-elevation-500 sm:px-24 lg:grid lg:w-160 lg:max-w-none lg:scroll-pb-48 lg:grid-cols-[minmax(0,1fr)] lg:grid-rows-[1fr_auto_1fr] lg:gap-0 lg:overflow-y-auto lg:rounded-l-none">
				<Image
					alt="Code the Change YYC"
					className="h-18 w-auto self-center sm:h-22.5 lg:self-start lg:justify-self-center"
					height={90}
					preload
					src="/svgs/CTCLogoWithText.svg"
					width={173}
				/>
				<div className="flex flex-col gap-6 lg:pt-6">{children}</div>
			</main>
		</div>
	);
}

interface AuthHeadingProps {
	title: ReactNode;
	description?: ReactNode;
}

export function AuthHeading({ title, description }: AuthHeadingProps) {
	return (
		<div>
			<h1 className="text-balance font-semibold text-[28px] leading-9">
				{title}
			</h1>
			{description && (
				<p className="mt-2 text-muted-foreground">{description}</p>
			)}
		</div>
	);
}

/**
 * The buttons that end an auth or onboarding screen. On desktop they stay
 * pinned to the bottom of the panel, with the content above fading out beneath
 * them until it's scrolled to the end. Must be the panel's last content.
 */
export function AuthActions({
	children,
	className
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		// The negative offsets run the backdrop over the panel's bottom padding,
		// so content scrolling past the buttons is hidden all the way down.
		<div
			className={cn(
				"lg:-mb-12 lg:before:fade-at-scroll-end lg:-bottom-12 flex flex-col gap-4 lg:sticky lg:z-10 lg:bg-background lg:pb-12 lg:before:pointer-events-none lg:before:absolute lg:before:inset-x-0 lg:before:bottom-full lg:before:h-16 lg:before:bg-linear-to-b lg:before:from-transparent lg:before:to-background",
				className
			)}
		>
			{children}
		</div>
	);
}
