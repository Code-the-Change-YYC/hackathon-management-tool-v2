"use client";

import { useEffect, useRef } from "react";

type StyledQRCodeProps = {
	value: string;
};

// TODO: figure out other ways to render this QR code in the server instead
export function StyledQRCode({ value }: StyledQRCodeProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const containerElement = containerRef.current;

		if (!containerElement) {
			return;
		}

		let isCancelled = false;

		async function renderQRCode(container: HTMLDivElement) {
			const { default: QRCodeStyling } = await import("qr-code-styling");

			if (isCancelled) {
				return;
			}

			const qrCode = new QRCodeStyling({
				width: 1000,
				height: 1000,
				type: "svg",
				data: value,
				image: "/svgs/heart-icon.svg",
				margin: 40,
				qrOptions: {
					errorCorrectionLevel: "H"
				},
				backgroundOptions: {
					color: "#ffd2dc"
				},
				imageOptions: {
					hideBackgroundDots: false,
					imageSize: 0.28,
					margin: 0
				},
				dotsOptions: {
					color: "#7055fd",
					type: "rounded"
				},
				cornersSquareOptions: {
					color: "#7055fd",
					type: "extra-rounded"
				},
				cornersDotOptions: {
					color: "#7055fd",
					type: "dot"
				}
			});

			container.replaceChildren();
			qrCode.append(container);
		}

		void renderQRCode(containerElement);

		return () => {
			isCancelled = true;
			containerElement.replaceChildren();
		};
	}, [value]);

	return (
		<div
			aria-label="Meal ticket QR code"
			className="h-full w-full overflow-hidden rounded-2xl [&>svg]:h-full [&>svg]:w-full"
			ref={containerRef}
			role="img"
		/>
	);
}
