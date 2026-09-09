import AppFooter from "./AppFooter";
import Sidebar from "./Sidebar";

export default function AppShell({
	children,
	userName
}: {
	children: React.ReactNode;
	userName?: string;
}) {
	return (
		<div className="flex min-h-screen flex-col bg-grey-50 lg:flex-row">
			<Sidebar userName={userName} />
			<div className="flex min-w-0 flex-1 flex-col">
				<main className="flex-1">{children}</main>
				<AppFooter />
			</div>
		</div>
	);
}
