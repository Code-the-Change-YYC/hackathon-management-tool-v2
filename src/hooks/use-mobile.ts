import { useEffect, useState } from "react";

// Keep this aligned with Tailwind's default md breakpoint.
const DESKTOP_MEDIA_QUERY = "(min-width: 48rem)";

export function useIsMobile() {
	const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

	useEffect(() => {
		const mql = window.matchMedia(DESKTOP_MEDIA_QUERY);
		const onChange = () => {
			setIsMobile(!mql.matches);
		};
		mql.addEventListener("change", onChange);
		onChange();
		return () => mql.removeEventListener("change", onChange);
	}, []);

	return !!isMobile;
}
