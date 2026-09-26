"use client";

import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

type CountdownTileProps = {
	name: string;
	value: number;
	className?: string;
};

export default function CountdownTile({
	name,
	value,
	className
}: CountdownTileProps) {
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) return null;

	return (
		<div
			className={twMerge(
				"relative flex aspect-square w-20 flex-col items-center justify-center rounded-2xl bg-awesome-purple text-white sm:w-24 md:w-32",
				className
			)}
		>
			<span className="font-semibold text-4xl sm:text-5xl md:text-7xl lg:text-8xl">
				{String(value).padStart(2, "0")}
			</span>
			<div className="-translate-y-1/2 absolute inset-x-0 top-[55%] border-white/50 border-b-2" />
			<span className="-bottom-6 absolute text-center font-semibold text-dark-grey text-xs uppercase tracking-widest sm:text-sm">
				{name}
			</span>
		</div>
	);
}
