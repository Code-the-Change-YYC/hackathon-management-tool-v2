type DietaryRestrictionProps = {
	allergies: string | null | undefined;
};

function getDietaryRestrictions(allergies: string | null | undefined) {
	return (
		allergies
			?.split(",")
			.map((restriction) => restriction.trim())
			.filter(Boolean) ?? []
	);
}

export function DietaryRestriction({ allergies }: DietaryRestrictionProps) {
	const dietaryRestrictions = getDietaryRestrictions(allergies);

	return (
		<section className="space-y-4">
			<h2 className="font-semibold text-dark-grey text-lg">
				Dietary Restrictions
			</h2>

			<div className="rounded-lg bg-pale-grey px-5 py-4">
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0 space-y-4">
						<p className="text-dark-grey text-sm">
							Your registered dietary restrictions:
						</p>
						{dietaryRestrictions.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{dietaryRestrictions.map((restriction) => (
									<span
										className="rounded-md bg-lilac-purple/50 px-3 py-1 font-medium text-awesomer-purple text-xs"
										key={restriction}
									>
										{restriction}
									</span>
								))}
							</div>
						) : (
							<p className="font-medium text-dark-grey/60 text-sm">
								None registered
							</p>
						)}
					</div>

					<button
						className="inline-flex shrink-0 cursor-pointer items-center rounded-md px-3 py-2 font-medium text-dark-grey text-sm transition hover:bg-light-grey"
						type="button"
					>
						Edit
					</button>
				</div>
			</div>
		</section>
	);
}
