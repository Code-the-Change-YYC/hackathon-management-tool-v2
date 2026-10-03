import type { Metadata } from "next";

export const metadata: Metadata = {
	// Each step names itself, so tabs and history tell the steps apart.
	title: {
		default: "Register | Hack the Change",
		template: "%s | Hack the Change"
	}
};

export default function OnboardingLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	return children;
}
