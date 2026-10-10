import type { Metadata } from "next";
import StatusPage from "@/app/components/StatusPage";

export const metadata: Metadata = {
	title: "Page not found | Hack the Change"
};

export default function NotFound() {
	return <StatusPage variant="not-found" />;
}
