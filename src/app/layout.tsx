import "./global.css";

import type { Metadata } from "next";

import { Toaster } from "@/app/components/ui/sonner";
import { omnes } from "@/app/fonts";
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
