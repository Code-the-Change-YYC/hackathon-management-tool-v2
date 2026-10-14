"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 30_000;

// Re-renders the page's server components so admin changes, like a new
// judging phase, show up without a reload.
export function AutoRefresh() {
	const router = useRouter();

	useEffect(() => {
		function refresh() {
			if (document.visibilityState === "visible") router.refresh();
		}

		const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
		document.addEventListener("visibilitychange", refresh);
		return () => {
			window.clearInterval(interval);
			document.removeEventListener("visibilitychange", refresh);
		};
	}, [router]);

	return null;
}
