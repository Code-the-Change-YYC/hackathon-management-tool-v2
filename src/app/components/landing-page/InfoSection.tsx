import type { StaticImageData } from "next/image";
import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const ACCENT_SRC = {
	accent_green: "/svgs/landingPage/accent_green.svg",
	accent_purple: "/svgs/landingPage/accent_purple.svg",
	accent_pink: "/svgs/landingPage/accent_pink.svg"
} as const;

// Stroke width in screen pixels, shared by every squiggle regardless of size
const SQUIGGLE_STROKE_WIDTH = 5;

const SQUIGGLES = {
	green_squiggle: {
		viewBox: "0 0 409 327",
		color: "#00D3A9",
		path: "M-23 3C13.035 42.6667 109.508 142.835 244.597 91C407.481 28.5 465.5 232 330 324"
	},
	green_squiggle2: {
		viewBox: "0 0 821 454",
		color: "#02C79F",
		path: "M51.597 3C-74.5201 33.472 48.977 328.855 373.906 171.999C637.524 44.7409 904.964 257.501 791.007 451"
	},
	green_squiggle3: {
		viewBox: "0 0 246 86",
		color: "#00D3A9",
		path: "M242.717 2.9994C187.568 57.1058 42.5408 96.55 3.63473 77.352"
	},
	pink_squiggle: {
		viewBox: "0 0 256 168",
		color: "#FFD2DC",
		path: "M0 164.966C26.8321 130.637 80.3169 -19.5075 252.581 5.86902"
	},
	purple_squiggle: {
		viewBox: "0 0 1070 291",
		color: "#7055FD",
		path: "M3.58573 148.315C23.6055 195.063 100.939 301.645 246.427 236.703C256.897 232.03 296.374 208.467 292.077 193.759C280.045 152.579 183.63 217.698 437.936 276.439C511 293.316 1038 331.5 1066.5 3.49994"
	}
} as const;

type SectionTitleProps = {
	title?: string;
	titlePrefixColor?: string;
	titleColor?: string;
	titleHighlight: string;
	accentSrc?: keyof typeof ACCENT_SRC;
	accentPosition?: "before" | "after";
};

type InfoSectionProps = SectionTitleProps & {
	bodyTextColor?: string;
	paragraphs?: string[];
	bodyContent?: ReactNode;
	imageSrc?: string | StaticImageData;
	imageAlt?: string;
	bgColor: string;
	reverse?: boolean;
	decoration?: ReactNode;
};

// Decorative line positioned against the section's content box. Squiggles can
// hang past the section's edges into its neighbours; the page clips any
// horizontal overflow.
export function Squiggle({
	src,
	className
}: {
	src: keyof typeof SQUIGGLES;
	className?: string;
}) {
	const { viewBox, color, path } = SQUIGGLES[src];
	const [, , width, height] = viewBox.split(" ");

	return (
		<svg
			aria-hidden="true"
			className={cn("absolute h-auto max-w-none overflow-visible", className)}
			fill="none"
			height={height}
			viewBox={viewBox}
			width={width}
		>
			<path
				d={path}
				stroke={color}
				strokeLinecap="round"
				strokeWidth={SQUIGGLE_STROKE_WIDTH}
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	);
}

export function SectionWrapper({
	children,
	bgColor,
	reverse = false,
	decoration
}: {
	children: ReactNode;
	bgColor: string;
	reverse?: boolean;
	decoration?: ReactNode;
}) {
	return (
		<section
			className={cn(
				"w-full px-6 py-14 sm:px-12 md:py-20 lg:px-20 lg:py-28",
				bgColor
			)}
		>
			<div
				className={cn(
					"relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-20 lg:gap-24 xl:gap-24",
					reverse ? "lg:flex-row-reverse" : "lg:flex-row"
				)}
			>
				{decoration && (
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 hidden select-none lg:block"
					>
						{decoration}
					</div>
				)}
				{children}
			</div>
		</section>
	);
}

export function SectionTitle({
	title,
	titlePrefixColor = "text-white",
	titleColor = "text-white",
	titleHighlight,
	accentSrc,
	accentPosition = "before"
}: SectionTitleProps) {
	const accent = accentSrc && (
		<Image
			alt=""
			className={cn(
				"h-7 w-auto shrink-0 sm:h-9",
				accentPosition === "before" &&
					"lg:-translate-y-1/2 lg:absolute lg:top-1/2 lg:right-full lg:mr-2"
			)}
			height={44}
			src={ACCENT_SRC[accentSrc]}
			width={35}
		/>
	);

	return (
		<div className="relative inline-flex items-center gap-2">
			{accentPosition === "before" && accent}
			<h2 className="font-bold text-3xl sm:text-4xl lg:text-5xl">
				{title && (
					<span className={`${titlePrefixColor} not-italic`}>{title} </span>
				)}
				<span className={`${titleColor} italic`}>{titleHighlight}</span>
			</h2>
			{accentPosition === "after" && accent}
		</div>
	);
}

export default function InfoSection({
	bodyTextColor = "text-white/80",
	paragraphs,
	bodyContent,
	imageSrc,
	imageAlt,
	bgColor,
	reverse = false,
	decoration,
	...titleProps
}: InfoSectionProps) {
	return (
		<SectionWrapper bgColor={bgColor} decoration={decoration} reverse={reverse}>
			{imageSrc && (
				<div className="relative flex size-48 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[8px_8px_0_0_var(--color-lilac-purple)] sm:size-60 md:size-64 md:rounded-[30px] md:shadow-[12px_12px_0_0_var(--color-lilac-purple)] lg:size-72 xl:size-96">
					<Image
						alt={imageAlt ?? ""}
						className="h-auto w-auto object-contain"
						height={298}
						src={imageSrc}
						width={326}
					/>
				</div>
			)}

			<div className="relative flex w-full max-w-2xl flex-col gap-5 md:gap-6 lg:max-w-none lg:flex-1">
				<SectionTitle {...titleProps} />

				{bodyContent
					? bodyContent
					: paragraphs?.map((para) => (
							<p
								className={`${bodyTextColor} font-medium text-base leading-7 sm:text-xl sm:leading-8 lg:text-2xl lg:leading-9`}
								key={para}
							>
								{para}
							</p>
						))}
			</div>
		</SectionWrapper>
	);
}
