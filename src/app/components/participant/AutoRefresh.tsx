"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 30_000;

// A static file, so checking that the server is reachable costs almost nothing.
const CONNECTIVITY_CHECK_URL = "/manifest.webmanifest";

async function canReachServer() {
	try {
		const response = await fetch(CONNECTIVITY_CHECK_URL, {
			method: "HEAD",
			cache: "no-store"
		});
		return response.ok;
	} catch {
		return false;
	}
}

// Re-renders the page's server components so admin changes, like a new
// judging phase, show up without a reload. A failed router.refresh() falls
// back to a full page load, which replaces the page with the browser's offline
// screen, so it only runs once the server is reachable.
export function AutoRefresh() {
	const router = useRouter();

	useEffect(() => {
		let isChecking = false;

		async function refresh() {
			if (document.visibilityState !== "visible" || !navigator.onLine) return;
			if (isChecking) return;
			isChecking = true;
			if (await canReachServer()) router.refresh();
			isChecking = false;
		}

		const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
		document.addEventListener("visibilitychange", refresh);
		window.addEventListener("online", refresh);
		return () => {
			window.clearInterval(interval);
			document.removeEventListener("visibilitychange", refresh);
			window.removeEventListener("online", refresh);
		};
	}, [router]);

	return null;
}
