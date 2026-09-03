import AdminNavbar from "@/app/components/admin/AdminNavbar";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";

export default async function AdminLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	const session = await requireRole([Role.ADMIN]);

	return (
		<div className="flex w-screen flex-col">
			<div className="flex w-screen flex-col lg:flex-row">
				<AdminNavbar user={session.user} />
				{children}
			</div>
		</div>
	);
}
