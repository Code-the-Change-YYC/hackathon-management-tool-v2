"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

// Re-fetches the page's server data after a mutation. `then` runs in the same
// transition, so its state change (like closing a dialog) waits for the fresh
// data instead of flashing stale props.
export function useRefresh() {
	const router = useRouter();
	const [isRefreshing, startTransition] = useTransition();

	function refresh(then?: () => void) {
		startTransition(() => {
			router.refresh();
			then?.();
		});
	}

	return { isRefreshing, refresh };
}
