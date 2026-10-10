"use client";

import StatusPage from "@/app/components/StatusPage";

export default function ErrorPage({ retry }: { retry: () => void }) {
	return (
		<>
			<title>Something went wrong | Hack the Change</title>
			<StatusPage retry={retry} variant="error" />
		</>
	);
}
