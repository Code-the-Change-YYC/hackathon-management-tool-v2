import { AuthShell } from "@/app/components/auth/AuthShell";

export default function AuthLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	return <AuthShell>{children}</AuthShell>;
}
