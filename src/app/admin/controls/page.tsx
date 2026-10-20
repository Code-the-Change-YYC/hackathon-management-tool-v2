import type { Metadata } from "next";
import AdminControlsView from "@/app/components/admin/reset/AdminControlsView";

export const metadata: Metadata = {
	title: "Admin Controls | Hack the Change"
};

export default function AdminControlsPage() {
	return <AdminControlsView />;
}
