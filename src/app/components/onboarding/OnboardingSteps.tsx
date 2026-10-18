import Link from "next/link";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/lib/onboarding";
import { ONBOARDING_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

const STEP_NAMES: Record<OnboardingStep, string> = {
	personalDetails: "Personal details",
	foodPreferences: "Food preferences",
	mlhPolicies: "MLH policies",
	discord: "Discord",
	team: "Team"
};

const BAR = "block h-1.5 w-full rounded-full";

/**
 * A row of bars, one per onboarding step, filled up to the current one.
 * Earlier steps link back to themselves; they're always open once a later
 * step is (see `canAccessStep`).
 */
export function OnboardingSteps({ current }: { current: OnboardingStep }) {
	const currentIndex = ONBOARDING_STEPS.indexOf(current);

	return (
		<nav aria-label="Registration steps" className="mt-4 mb-2">
			<ol className="flex gap-1.5">
				{ONBOARDING_STEPS.map((step, index) => {
					const label = `Step ${index + 1} of ${ONBOARDING_STEPS.length}: ${STEP_NAMES[step]}`;

					if (index < currentIndex) {
						return (
							<li className="flex-1" key={step}>
								{/* The padding makes a bigger target than the thin bar. */}
								<Link
									aria-label={`Back to ${label}`}
									className="group -my-2.5 block rounded-sm py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
									href={ONBOARDING_ROUTES[step]}
								>
									<span
										className={cn(
											BAR,
											"bg-primary transition-colors group-hover:bg-primary/60"
										)}
									/>
								</Link>
							</li>
						);
					}

					const isCurrent = index === currentIndex;
					return (
						<li
							aria-current={isCurrent ? "step" : undefined}
							className="flex-1"
							key={step}
						>
							<span
								className={cn(BAR, isCurrent ? "bg-primary" : "bg-grey-300")}
							/>
							<span className="sr-only">{label}</span>
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
