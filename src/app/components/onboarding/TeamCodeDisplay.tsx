"use client";

import { useCopy } from "@/hooks/use-copy";

export function TeamCodeDisplay({ code }: { code: string }) {
	const { copied, copy } = useCopy();
	const characters = Array.from(code, (character, position) => ({
		character,
		position
	}));

	return (
		<div className="flex flex-col items-center gap-2 py-4">
			<button
				className="cursor-pointer font-medium text-purple-800 text-sm underline-offset-4 hover:underline"
				onClick={() => copy(code)}
				type="button"
			>
				{copied ? "Copied!" : "Copy to clipboard"}
			</button>
			<p className="sr-only">Your team invite code is {code}</p>
			<div
				aria-hidden="true"
				className="flex w-full justify-between gap-1.5 sm:justify-center sm:gap-4"
			>
				{characters.map(({ character, position }) => (
					<span
						className="flex h-13 min-w-0 max-w-12 flex-1 items-center justify-center rounded-lg border border-input font-medium text-[22px]"
						key={position}
					>
						{character}
					</span>
				))}
			</div>
		</div>
	);
}
