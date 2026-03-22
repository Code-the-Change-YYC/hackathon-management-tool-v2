"use client";

import { type IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";

export default function MealScanner() {
	const handleScan = (detectedCodes: IDetectedBarcode[]) => {
		console.log("detected codes:", detectedCodes);
		detectedCodes.forEach((code) => {
			console.log(`Format: ${code.format}, Value: ${code.rawValue}`);
		});
	};

	return (
		<Scanner onError={(error) => console.error(error)} onScan={handleScan} />
	);
}
