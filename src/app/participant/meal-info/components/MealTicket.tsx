import QRCode from "react-qr-code";

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

			<div className="grid overflow-hidden rounded-lg bg-pastel-pink shadow-[0_14px_34px_rgba(255,133,156,0.18)] lg:grid-cols-[1fr_1.05fr_280px]">
				<div className="relative flex min-h-56 flex-col justify-center gap-2 border-white/80 border-b border-dashed px-6 py-8 sm:px-10 lg:border-r lg:border-b-0">
					<div className="-left-3 -translate-y-1/2 absolute top-1/2 hidden h-6 w-6 rounded-full bg-pale-grey lg:block" />
					<div className="-right-3 -translate-y-1/2 absolute top-1/2 hidden h-6 w-6 rounded-full bg-pale-grey lg:block" />
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

				<div
					aria-hidden="true"
					className="hidden min-h-56 border-white/80 border-b border-dashed sm:block lg:border-r lg:border-b-0"
				/>

				<div className="relative flex min-h-56 items-center justify-center bg-pastel-pink/60 px-6 py-8">
					<div className="-left-3 -translate-y-1/2 absolute top-1/2 hidden h-6 w-6 rounded-full bg-pale-grey lg:block" />
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
