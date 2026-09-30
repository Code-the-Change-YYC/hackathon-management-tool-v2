import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Register | Hack the Change"
};

export default function OnboardingLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	return children;
}
