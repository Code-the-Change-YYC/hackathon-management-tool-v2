import { More1Line } from "@mingcute/react";

export default function CountdownWindow({
	children
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative mx-auto mb-8 hidden w-full max-w-285 flex-col overflow-hidden rounded-sm border border-black/20 bg-white md:flex">
			<div className="px-4 pt-4">
				<More1Line
					aria-hidden="true"
					className="text-awesomer-purple"
					size={24}
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
