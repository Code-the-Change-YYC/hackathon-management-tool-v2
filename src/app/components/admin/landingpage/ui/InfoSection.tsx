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
		<section className={`w-full ${bgColor} px-40 py-32`}>
			<div
				className={`mx-auto flex max-w-7xl flex-col items-center justify-between gap-18 ${reverse ? "md:flex-row-reverse" : "md:flex-row"}`}
			>
				<div className="flex h-96 w-96 min-w-75 shrink-0 items-center justify-center overflow-hidden rounded-[30px] bg-white shadow-md">
					<Image
						alt={imageAlt}
						className="h-72 w-80 object-contain"
						height={298}
						src={imageSrc}
						width={326}
					/>
				</div>

				<div className="flex min-w-75 max-w-lg flex-col gap-6">
					{titleHighlight && (
						<div className="relative inline-flex items-center gap-2">
							{accentSrc && accentPosition === "before" && (
								<Image
									alt=""
									className="-left-10 -translate-y-1/2 absolute top-1/2"
									height={30}
									src={accentSrc}
									width={24}
								/>
							)}
							<h2 className="pr-2 font-semibold text-3xl md:text-5xl">
								{title && (
									<span className="text-white not-italic">{title} </span>
								)}
								<span className={`${titleColor} italic`}>{titleHighlight}</span>
							</h2>
							{accentSrc && accentPosition === "after" && (
								<Image
									alt=""
									className="shrink-0"
									height={30}
									src={accentSrc}
									width={24}
								/>
							)}
						</div>
					)}

					{bodyContent
						? bodyContent
						: paragraphs?.map((para) => (
								<p
									className={`${bodyTextColor} font-medium text-2xl leading-8`}
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
