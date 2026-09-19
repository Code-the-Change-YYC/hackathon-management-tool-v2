"use client";

import "./global.css";

import StatusPage from "@/app/components/StatusPage";
import { omnes } from "@/app/fonts";

export default function GlobalError({ retry }: { retry: () => void }) {
	return (
		<html className={omnes.variable} lang="en">
			<body>
				<title>Something went wrong | Hack the Change</title>
				<StatusPage retry={retry} variant="error" />
			</body>
		</html>
	);
}
