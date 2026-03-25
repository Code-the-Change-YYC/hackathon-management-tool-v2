"use client";

import { type IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";

export default function MealScanner({
	onDetected
}: {
	onDetected: (value: string) => void;
}) {
	const handleScan = (detectedCodes: IDetectedBarcode[]) => {
		if (!detectedCodes || detectedCodes.length === 0) return;
		detectedCodes.forEach((code) => {
			const val = code.rawValue;
			onDetected(val);
		});
	};

	return (
		<Scanner onError={(error) => console.error(error)} onScan={handleScan} />
	);
}
