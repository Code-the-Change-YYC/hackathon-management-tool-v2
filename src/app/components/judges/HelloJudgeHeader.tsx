function ScratchUnderline() {
	// Vibe coded for now, and easy to swap for a real asset later.
	return (
		<svg
			aria-hidden
			className="-bottom-5 absolute left-2 h-5 w-[88%]"
			fill="none"
			preserveAspectRatio="none"
			viewBox="0 0 92 18"
		>
			<title>Decorative underline</title>
			<path
				d="M2 12 C22 6 48 5 90 7"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="3"
			/>
			<path
				d="M18 16 C36 11 55 10 78 12"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2.5"
			/>
		</svg>
	);
}

export default function HelloJudgeHeader() {
	return (
		<div className="rounded-lg bg-white px-6 py-9 text-left shadow-md sm:px-7 sm:py-10">
			<p className="font-bold text-3xl text-dark-grey leading-none sm:text-4xl">
				Hello,{" "}
				<span className="relative inline-block font-bold text-3xl text-dark-pink italic leading-none sm:text-4xl">
					Judge!
					<ScratchUnderline />
				</span>
			</p>
		</div>
	);
}
