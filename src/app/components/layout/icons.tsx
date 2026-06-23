import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 1.75,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
	viewBox: "0 0 24 24",
	xmlns: "http://www.w3.org/2000/svg"
};

export function DashboardIcon(props: IconProps) {
	return (
		<svg aria-hidden="true" {...base} {...props}>
			<rect height="8" rx="1.5" width="7" x="3" y="3" />
			<rect height="5" rx="1.5" width="7" x="3" y="15" />
			<rect height="8" rx="1.5" width="7" x="14" y="13" />
			<rect height="5" rx="1.5" width="7" x="14" y="3" />
		</svg>
	);
}

export function ScheduleIcon(props: IconProps) {
	return (
		<svg aria-hidden="true" {...base} {...props}>
			<rect height="16" rx="2" width="18" x="3" y="5" />
			<path d="M3 9h18M8 3v4M16 3v4" />
		</svg>
	);
}

export function TeamIcon(props: IconProps) {
	return (
		<svg aria-hidden="true" {...base} {...props}>
			<path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
			<circle cx="9" cy="7" r="3" />
			<path d="M22 19v-1a4 4 0 0 0-3-3.87M16 4.13A4 4 0 0 1 16 12" />
		</svg>
	);
}

export function MealIcon(props: IconProps) {
	return (
		<svg aria-hidden="true" {...base} {...props}>
			<path d="M4 3v7a2 2 0 0 0 2 2 2 2 0 0 0 2-2V3M6 3v18M17 3c-1.66 0-3 2-3 5s1 4 3 4v9" />
		</svg>
	);
}

export function JudgingIcon(props: IconProps) {
	return (
		<svg aria-hidden="true" {...base} {...props}>
			<path d="M9 11l3 3L22 4" />
			<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
		</svg>
	);
}

export function HelpIcon(props: IconProps) {
	return (
		<svg aria-hidden="true" {...base} {...props}>
			<circle cx="12" cy="12" r="9" />
			<path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3.5" />
			<path d="M12 17h.01" />
		</svg>
	);
}

export function LinkIcon(props: IconProps) {
	return (
		<svg aria-hidden="true" {...base} {...props}>
			<path d="M7 17 17 7M9 7h8v8" />
		</svg>
	);
}

export function BellIcon(props: IconProps) {
	return (
		<svg aria-hidden="true" {...base} {...props}>
			<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
			<path d="M13.73 21a2 2 0 0 1-3.46 0" />
		</svg>
	);
}

export function MailIcon(props: IconProps) {
	return (
		<svg aria-hidden="true" {...base} {...props}>
			<rect height="14" rx="2" width="18" x="3" y="5" />
			<path d="m3 7 9 6 9-6" />
		</svg>
	);
}

export function EditIcon(props: IconProps) {
	return (
		<svg aria-hidden="true" {...base} {...props}>
			<path d="M12 20h9" />
			<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
		</svg>
	);
}

export function LeaveIcon(props: IconProps) {
	return (
		<svg aria-hidden="true" {...base} {...props}>
			<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
			<path d="m16 17 5-5-5-5M21 12H9" />
		</svg>
	);
}

export function PlusIcon(props: IconProps) {
	return (
		<svg aria-hidden="true" {...base} {...props}>
			<path d="M12 5v14M5 12h14" />
		</svg>
	);
}

export function CloseIcon(props: IconProps) {
	return (
		<svg aria-hidden="true" {...base} {...props}>
			<path d="M18 6 6 18M6 6l12 12" />
		</svg>
	);
}

export function ArrowRightIcon(props: IconProps) {
	return (
		<svg aria-hidden="true" {...base} {...props}>
			<path d="M5 12h14M13 5l7 7-7 7" />
		</svg>
	);
}

export function MenuIcon(props: IconProps) {
	return (
		<svg aria-hidden="true" {...base} {...props}>
			<path d="M3 12h18M3 6h18M3 18h18" />
		</svg>
	);
}
