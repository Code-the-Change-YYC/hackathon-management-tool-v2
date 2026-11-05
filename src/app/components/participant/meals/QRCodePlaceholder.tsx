// A QR-like pattern in the same style as StyledQRCode, used where a real code
// isn't available. The dots come from a fixed hash so the server and client
// render the same pattern.
const MODULE_COUNT = 33;
const FINDER_SIZE = 7;
const LOGO_START = 12;
const LOGO_END = 21;

const FINDER_ORIGINS = [
	[0, 0],
	[MODULE_COUNT - FINDER_SIZE, 0],
	[0, MODULE_COUNT - FINDER_SIZE]
] as const;

function isInFinder(x: number, y: number) {
	return FINDER_ORIGINS.some(
		([originX, originY]) =>
			x >= originX - 1 &&
			x <= originX + FINDER_SIZE &&
			y >= originY - 1 &&
			y <= originY + FINDER_SIZE
	);
}

function isInLogo(x: number, y: number) {
	return x >= LOGO_START && x < LOGO_END && y >= LOGO_START && y < LOGO_END;
}

function isFilled(x: number, y: number) {
	const hash = (Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663)) >>> 0;
	return hash % 100 < 45;
}

const DOTS = Array.from(
	{ length: MODULE_COUNT * MODULE_COUNT },
	(_, index) =>
		[index % MODULE_COUNT, Math.floor(index / MODULE_COUNT)] as const
).filter(([x, y]) => !isInFinder(x, y) && !isInLogo(x, y) && isFilled(x, y));

export function QRCodePlaceholder({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="currentColor"
			viewBox="-1.5 -1.5 36 36"
		>
			{FINDER_ORIGINS.map(([x, y]) => (
				<g key={`${x}-${y}`}>
					<rect
						fill="none"
						height={FINDER_SIZE - 1}
						rx={2}
						stroke="currentColor"
						width={FINDER_SIZE - 1}
						x={x + 0.5}
						y={y + 0.5}
					/>
					<circle cx={x + FINDER_SIZE / 2} cy={y + FINDER_SIZE / 2} r={1.5} />
				</g>
			))}
			{DOTS.map(([x, y]) => (
				<circle cx={x + 0.5} cy={y + 0.5} key={`${x}-${y}`} r={0.45} />
			))}
		</svg>
	);
}
