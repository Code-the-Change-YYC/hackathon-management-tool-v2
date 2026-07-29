import QRCode from "react-qr-code";

const ticketEdgeScallops = Array.from({ length: 9 }, (_, index) => index);

type MealTicketProps = {
	userId: string;
	displayName: string;
	emailAddress: string;
	ticketMealName: string;
	ticketCopy: string;
};

export function MealTicket({
	userId,
	displayName,
	emailAddress,
	ticketMealName,
	ticketCopy
}: MealTicketProps) {
	return (
		<section className="space-y-4">
			<h2 className="font-semibold text-dark-grey text-lg">Your Meal Ticket</h2>

			<div className="relative grid overflow-hidden bg-pastel-pink shadow-[0_14px_34px_rgba(255,133,156,0.18)] lg:grid-cols-[minmax(0,1fr)_280px]">
				<div className="-translate-x-1/2 pointer-events-none absolute inset-y-2 left-0 z-10 flex flex-col justify-between">
					{ticketEdgeScallops.map((scallop) => (
						<div
							aria-hidden="true"
							className="h-5 w-5 rounded-full bg-light-grey"
							key={`left-${scallop}`}
						/>
					))}
				</div>
				<div className="pointer-events-none absolute inset-y-2 right-0 z-10 flex translate-x-1/2 flex-col justify-between">
					{ticketEdgeScallops.map((scallop) => (
						<div
							aria-hidden="true"
							className="h-5 w-5 rounded-full bg-light-grey"
							key={`right-${scallop}`}
						/>
					))}
				</div>

				<div className="relative flex min-h-56 flex-col justify-center gap-2 px-6 py-8 sm:px-10">
					<div
						aria-hidden="true"
						className="absolute inset-y-0 right-0 hidden w-4 border-white/80 border-r-4 border-dashed lg:block"
					/>
					<p className="font-extrabold text-dark-pink text-xs uppercase">
						{ticketMealName} Ticket For
					</p>
					<p className="wrap-break-word font-bold text-dark-grey text-xl">
						{displayName}
					</p>
					<p className="max-w-sm text-dark-grey/70 text-sm leading-6">
						Present this QR code to a member of Code the Change scanning tickets
						at the door to receive your meal. {ticketCopy}
					</p>
				</div>

				<div className="relative flex min-h-56 items-center justify-center border-white/80 border-t-4 border-dashed bg-pastel-pink/60 px-6 py-8 lg:border-t-0">
					<div className="-left-0.5 -translate-x-1/2 -translate-y-1/2 absolute top-0 hidden h-6 w-6 rounded-full bg-light-grey lg:block" />
					<div className="-left-0.5 -translate-x-1/2 absolute bottom-0 hidden h-6 w-6 translate-y-1/2 rounded-full bg-light-grey lg:block" />
					<div className="rounded-lg bg-pale-grey p-4 text-awesomer-purple">
						<QRCode
							className="h-44 w-44 [&>path:first-of-type]:fill-pale-grey [&>path:last-of-type]:fill-awesomer-purple"
							value={`${userId}::${displayName}::${emailAddress}`}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
