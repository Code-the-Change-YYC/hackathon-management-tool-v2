import "@/styles/globals.scss";
import "./global.css";

import type { Metadata } from "next";
import localFont from "next/font/local";

import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
	title: "Hack the Change 2026",
	description: "Hack the Change",
	icons: [{ rel: "icon", url: "/favicon.ico" }]
};

const Omnes = localFont({
	src: "./fonts/Omnes Medium.ttf",
	variable: "--font-omnes"
});

export default function RootLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body className={Omnes.className}>
				<TRPCReactProvider>{children}</TRPCReactProvider>
			</body>
		</html>
	);
}
