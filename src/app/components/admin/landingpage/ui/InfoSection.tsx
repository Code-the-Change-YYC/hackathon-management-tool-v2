import Image from "next/image";

type InfoSectionProps = {
	title?: string;
	titleColor?: string;
	titleHighlight?: string;
	bodyTextColor?: string;
	paragraphs: string[];
	imageSrc: string;
	imageAlt: string;
	bgColor: string;
	reverse?: boolean;
};

export default function InfoSection({
	title,
	titleColor,
	titleHighlight,
	bodyTextColor,
	paragraphs,
	imageSrc,
	imageAlt,
	bgColor,
	reverse = false
}: InfoSectionProps) {
	return (
		<section className={`w-full ${bgColor} px-6 py-12 sm:px-12`}>
			<div
				className={`mx-auto flex max-w-4xl flex-col items-center gap-8 ${reverse ? "md:flex-row-reverse" : "md:flex-row"}`}
			>
				<div className="flex flex-1 flex-col gap-4">
					<h2 className="font-bold text-white text-xl">
						{title}{" "}
						{titleHighlight && (
							<span className={`${titleColor} italic`}>{titleHighlight}</span>
						)}
					</h2>
					{paragraphs.map((para) => (
						<p
							className={`text-sm ${bodyTextColor} leading-relaxed`}
							key={para}
						>
							{para}
						</p>
					))}
				</div>

				<div className="flex flex-1 items-center justify-center">
					<div className="overflow-hidden rounded-2xl bg-white p-4 shadow-md">
						<Image alt={imageAlt} height={200} src={imageSrc} width={200} />
					</div>
				</div>
			</div>
		</section>
	);
}
