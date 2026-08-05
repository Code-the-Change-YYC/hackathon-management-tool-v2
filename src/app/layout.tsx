import "@/styles/globals.scss";
import "./global.css";

import type { Metadata } from "next";
import localFont from "next/font/local";

import { Toaster } from "@/app/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
	title: "Hack the Change",
	description: "Hack the Change",
	icons: [
		{
			rel: "icon",
			type: "image/x-icon",
			sizes: "32x32",
			url: "/favicon.ico"
		}
	]
};

const omnes = localFont({
	variable: "--font-omnes",
	display: "swap",
	src: [
		{ path: "./fonts/omnes-hairline.ttf", weight: "100", style: "normal" },
		{
			path: "./fonts/omnes-hairline-italic.ttf",
			weight: "100",
			style: "italic"
		},
		{ path: "./fonts/omnes-thin.ttf", weight: "200", style: "normal" },
		{ path: "./fonts/omnes-thin-italic.ttf", weight: "200", style: "italic" },
		{ path: "./fonts/omnes-extralight.ttf", weight: "250", style: "normal" },
		{
			path: "./fonts/omnes-extralight-italic.ttf",
			weight: "250",
			style: "italic"
		},
		{ path: "./fonts/omnes-light.ttf", weight: "300", style: "normal" },
		{ path: "./fonts/omnes-light-italic.ttf", weight: "300", style: "italic" },
		{ path: "./fonts/omnes-regular.ttf", weight: "400", style: "normal" },
		{ path: "./fonts/omnes-italic.ttf", weight: "400", style: "italic" },
		{ path: "./fonts/omnes-medium.ttf", weight: "500", style: "normal" },
		{ path: "./fonts/omnes-medium-italic.ttf", weight: "500", style: "italic" },
		{ path: "./fonts/omnes-semibold.ttf", weight: "600", style: "normal" },
		{
			path: "./fonts/omnes-semibold-italic.ttf",
			weight: "600",
			style: "italic"
		},
		{ path: "./fonts/omnes-bold.ttf", weight: "700", style: "normal" },
		{ path: "./fonts/omnes-bold-italic.ttf", weight: "700", style: "italic" },
		{ path: "./fonts/omnes-black.ttf", weight: "900", style: "normal" },
		{ path: "./fonts/omnes-black-italic.ttf", weight: "900", style: "italic" }
	]
});

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
