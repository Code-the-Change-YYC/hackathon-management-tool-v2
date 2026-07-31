import Image from "next/image";

export default function CountdownWindow({
	children
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative mx-auto hidden w-full max-w-[1143px] flex-col overflow-hidden rounded-sm border border-black/20 bg-white md:flex">
			<div className="px-4 pt-4">
				<Image
					alt=""
					height={12}
					src="/svgs/landingPage/three_dots.svg"
					width={70}
				/>
			</div>

			<div className="mt-3 border border-dark-green bg-dark-green/50 px-6 pt-4 pb-8">
				<div className="rounded-t-[30px] bg-pastel-green px-8 pt-8 pb-16">
					{children}
				</div>
			</div>
		</div>
	);
}
