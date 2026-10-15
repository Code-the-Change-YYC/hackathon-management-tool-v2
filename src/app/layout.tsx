import "./global.css";

import type { Metadata, Viewport } from "next";

import { Toaster } from "@/app/components/ui/sonner";
import { omnes } from "@/app/fonts";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
	metadataBase: new URL("https://hackthechangeyyc.ca"),
	applicationName: "Hack the Change",
	title: "Hack the Change",
	description:
		"Hack the Change is an in-person, two-day, for-charity hackathon with the mission of coding a better world together.",
	openGraph: {
		type: "website",
		locale: "en_CA",
		siteName: "Hack the Change",
		title: "Hack the Change",
		description:
			"Hack the Change is an in-person, two-day, for-charity hackathon with the mission of coding a better world together."
	},
	twitter: {
		card: "summary_large_image",
		title: "Hack the Change",
		description:
			"Hack the Change is an in-person, two-day, for-charity hackathon with the mission of coding a better world together."
	}
};

export const viewport: Viewport = {
	themeColor: "#7054fd"
};

export default function RootLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html className={omnes.variable} lang="en">
			<body>
				<TRPCReactProvider>{children}</TRPCReactProvider>
				<Toaster />
			</body>
		</html>
	);
}
