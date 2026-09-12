"use client";

import { useEffect, useState } from "react";

export function useCurrentTime() {
	const [currentTime, setCurrentTime] = useState(() => new Date());
	useEffect(() => {
		const interval = window.setInterval(
			() => setCurrentTime(new Date()),
			30_000
		);
		return () => window.clearInterval(interval);
	}, []);
	return currentTime;
}
