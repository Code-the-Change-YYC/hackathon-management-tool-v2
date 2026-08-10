"use client";

import { type IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { useRef } from "react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { EVENT_TICKET_TOKEN_PATTERN } from "@/types/types";

const RECENT_SCAN_WINDOW_MS = 10_000;

function isEventTicketToken(value: string): boolean {
	return EVENT_TICKET_TOKEN_PATTERN.test(value);
}

export default function MealScanner({ eventId }: { eventId: string }) {
	const recentScansRef = useRef<Map<string, number>>(new Map());
	const utils = api.useUtils();
	const redeemTicket = api.events.redeemEventTicket.useMutation();

	// detectedCodes is the batch of QR codes detected by the camera.
	// can include the same code multiple times, or multiple different
	// codes from the same scan if there are multiple visible codes.
	const handleScan = (detectedCodes: IDetectedBarcode[]) => {
		if (!detectedCodes || detectedCodes.length === 0) return;
		detectedCodes.forEach((code) => {
			const token = code.rawValue;
			const now = Date.now();
			const lastScannedAt = recentScansRef.current.get(token);

			if (lastScannedAt && now - lastScannedAt < RECENT_SCAN_WINDOW_MS) {
				return;
			}

			recentScansRef.current.set(token, now);

			if (!isEventTicketToken(token)) {
				toast.error("This QR code is not a valid event ticket.");
				window.setTimeout(() => {
					recentScansRef.current.delete(token);
				}, RECENT_SCAN_WINDOW_MS);
				return;
			}

			redeemTicket.mutate(
				{ token, eventId },
				{
					onSuccess: (result) => {
						toast.success(
							`${result.participant.name} checked in successfully.`
						);
						void utils.events.getEventAttendees.invalidate({ eventId });
					},
					onError: (error) => {
						toast.error(error.message);
						window.setTimeout(() => {
							recentScansRef.current.delete(token);
						}, RECENT_SCAN_WINDOW_MS);
					}
				}
			);
		});
	};

	return (
		<Scanner
			formats={["qr_code"]}
			onError={(error) => console.error(error)}
			onScan={handleScan}
		/>
	);
}
