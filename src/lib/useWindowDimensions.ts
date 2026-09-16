import { useEffect, useState } from "react";

export default function useWindowDimensions() {
	const [windowDimensions, setWindowDimensions] = useState({
		height: 0,
		width: 0
	});

	useEffect(() => {
		function handleResize() {
			setWindowDimensions({
				height: window.innerHeight,
				width: window.innerWidth
			});
		}
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return windowDimensions;
}
