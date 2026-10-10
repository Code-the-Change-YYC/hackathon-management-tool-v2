import Link from "next/link";
import { Button, buttonVariants } from "@/app/components/ui/button";
import { ONBOARDING_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

/** Returns to the team situation step, or runs `onBack` instead when given. */
export function TeamGoBackButton({ onBack }: { onBack?: () => void }) {
	if (onBack) {
		return (
			<Button
				className="w-full"
				onClick={onBack}
				type="button"
				variant="outline"
			>
				Go back
			</Button>
		);
	}

	return (
		<Link
			className={cn(buttonVariants({ variant: "outline" }), "w-full")}
			href={ONBOARDING_ROUTES.team}
		>
			Go back
		</Link>
	);
}
