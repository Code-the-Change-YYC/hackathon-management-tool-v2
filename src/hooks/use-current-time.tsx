"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
	useSyncExternalStore
} from "react";

// When the server rendered the page. Components render with it while
// hydrating, so time-based text (like "In 5 min") matches the server HTML.
const ServerTimeContext = createContext<number | null>(null);

export function ServerTimeProvider({
	time,
	children
}: {
	time: number;
	children: ReactNode;
}) {
	return (
		<ServerTimeContext.Provider value={time}>
			{children}
		</ServerTimeContext.Provider>
	);
}

function subscribe() {
	return () => {};
}

export function useCurrentTime(intervalMs = 30_000) {
	const serverTime = useContext(ServerTimeContext);
	// True on the server and while hydrating, false for later client renders.
	const isHydrating = useSyncExternalStore(
		subscribe,
		() => false,
		() => true
	);
	const [currentTime, setCurrentTime] = useState(() =>
		isHydrating && serverTime !== null ? new Date(serverTime) : new Date()
	);
	useEffect(() => {
		setCurrentTime(new Date());
		const interval = window.setInterval(
			() => setCurrentTime(new Date()),
			intervalMs
		);
		return () => window.clearInterval(interval);
	}, [intervalMs]);
	return currentTime;
}
