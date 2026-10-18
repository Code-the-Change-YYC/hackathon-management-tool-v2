import type { Metadata } from "next";
import StatusPage from "@/app/components/StatusPage";

export const metadata: Metadata = {
	title: "Under construction | Hack the Change"
};

// Temporary placeholder the landing page's sign-up and login links point to
// while registration isn't open yet.
export default function UnderConstruction() {
	return <StatusPage variant="under-construction" />;
}
