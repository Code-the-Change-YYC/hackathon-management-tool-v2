import Image from "next/image";
import { Button, buttonVariants } from "@/app/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader
} from "@/app/components/ui/empty";

type StatusPageProps =
	| { variant: "not-found" }
	| { variant: "under-construction" }
	| { variant: "error"; retry: () => void };

const NOT_FOUND_MASCOT = {
	alt: "Our mascot searching for the missing page with a map and magnifying glass",
	height: 912,
	src: "/images/mascot-404.png",
	width: 923
};

const ERROR_MASCOT = {
	alt: "Our mascot puzzling over two disconnected computer cables",
	height: 1215,
	src: "/images/mascot-error.png",
	width: 1215
};

const CONTENT = {
	"not-found": {
		mascot: NOT_FOUND_MASCOT,
		title: "Page Not Found",
		description: "The link may have changed, or the page may no longer exist."
	},
	"under-construction": {
		mascot: ERROR_MASCOT,
		title: "Under Construction",
		description:
			"We're still building this page. Check back soon to join Hack the Change 2026!"
	},
	error: {
		mascot: ERROR_MASCOT,
		title: "Unexpected Error",
		description: "Give it another try, or head home and start fresh."
	}
} as const;

export default function StatusPage(props: StatusPageProps) {
	const { mascot, title, description } = CONTENT[props.variant];

	return (
		<div className="flex min-h-svh flex-col bg-background text-foreground">
			<main className="flex flex-1 items-center justify-center px-6 py-8 sm:py-12">
				<Empty className="max-w-xl gap-4 p-0">
					<Image
						alt={mascot.alt}
						className="h-auto w-50 sm:w-72"
						height={mascot.height}
						preload
						sizes="(min-width: 640px) 288px, 200px"
						src={mascot.src}
						width={mascot.width}
					/>
					<EmptyHeader className="max-w-md gap-3">
						<h1 className="font-semibold text-4xl tracking-tight">{title}</h1>
						<EmptyDescription>{description}</EmptyDescription>
					</EmptyHeader>
					<EmptyContent className="gap-3 sm:flex-row sm:justify-center">
						{props.variant === "error" && (
							<Button
								className="w-full sm:w-auto"
								onClick={props.retry}
								type="button"
							>
								Try again
							</Button>
						)}
						<a
							className={buttonVariants({
								variant: props.variant === "error" ? "outline" : "default",
								className: "w-full sm:w-auto"
							})}
							href="/"
						>
							Back to home
						</a>
					</EmptyContent>
				</Empty>
			</main>
		</div>
	);
}
