import type { StaticImageData } from "next/image";
import Image from "next/image";
import type { ReactNode } from "react";

export interface InfoSectionProps {
	title?: string;
	titleColor?: string;
	titleHighlight: string;
	bodyTextColor?: string;
	paragraphs?: string[];
	bodyContent?: ReactNode;
	imageSrc: string | StaticImageData;
	imageAlt: string;
	bgColor: string;
	accentSrc?: string;
	accentPosition?: "before" | "after";
	reverse?: boolean;
}

export default function InfoSection({
	title,
	titleColor = "text-white",
	titleHighlight,
	bodyTextColor = "text-white/80",
	paragraphs,
	bodyContent,
	imageSrc,
	imageAlt,
	bgColor,
	accentSrc,
	accentPosition = "before",
	reverse = false
}: InfoSectionProps) {
	return (
		<section
			className={`w-full ${bgColor} px-6 py-12 sm:px-12 md:px-20 lg:px-40 lg:py-32`}
		>
			<div
				className={`mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:gap-18 ${reverse ? "md:flex-row-reverse" : "md:flex-row"}`}
			>
				<div className="flex h-48 w-48 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md sm:h-64 sm:w-64 md:h-96 md:w-96 md:rounded-[30px]">
					<Image
						alt={imageAlt}
						className="h-36 w-40 object-contain sm:h-48 sm:w-52 md:h-72 md:w-80"
						height={298}
						src={imageSrc}
						width={326}
					/>
				</div>

				<div className="flex w-full max-w-lg flex-col gap-4 md:gap-6">
					{titleHighlight && (
						<div className="relative inline-flex items-center gap-2">
							{accentSrc && accentPosition === "before" && (
								<Image
									alt=""
									className="-left-6 -translate-y-1/2 sm:-left-10 absolute top-1/2"
									height={20}
									src={accentSrc}
									width={16}
								/>
							)}
							<h2 className="pr-2 font-semibold text-2xl sm:text-3xl md:text-5xl">
								{title && (
									<span className="text-white not-italic">{title} </span>
								)}
								<span className={`${titleColor} italic`}>{titleHighlight}</span>
							</h2>
							{accentSrc && accentPosition === "after" && (
								<Image
									alt=""
									className="shrink-0"
									height={20}
									src={accentSrc}
									width={16}
								/>
							)}
						</div>
					)}

					{bodyContent
						? bodyContent
						: paragraphs?.map((para) => (
								<p
									className={`${bodyTextColor} font-medium text-base leading-6 sm:text-xl sm:leading-7 md:text-2xl md:leading-8`}
									key={para}
								>
									{para}
								</p>
							))}
				</div>
			</div>
		</section>
	);
}
