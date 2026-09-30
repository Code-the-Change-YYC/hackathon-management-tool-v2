"use client";

import { useEffect, useState } from "react";

export function useCurrentTime(intervalMs = 30_000) {
	const [currentTime, setCurrentTime] = useState(() => new Date());
	useEffect(() => {
		const interval = window.setInterval(
			() => setCurrentTime(new Date()),
			intervalMs
		);
		return () => window.clearInterval(interval);
	}, [intervalMs]);
	return currentTime;
}
