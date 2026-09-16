"use client";

import {
	CheckCircleLine,
	CloseCircleLine,
	InformationLine,
	Loading3Line,
	WarningLine
} from "@mingcute/react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	return (
		<Sonner
			className="toaster group"
			icons={{
				success: <CheckCircleLine className="size-4" />,
				info: <InformationLine className="size-4" />,
				warning: <WarningLine className="size-4" />,
				error: <CloseCircleLine className="size-4" />,
				loading: <Loading3Line className="size-4 animate-spin" />
			}}
			style={
				{
					"--normal-bg": "oklch(0.205 0 0)",
					"--normal-text": "oklch(0.985 0 0)",
					"--normal-border": "oklch(0.205 0 0)",
					"--border-radius": "var(--radius)"
				} as React.CSSProperties
			}
			theme="dark"
			toastOptions={{
				classNames: {
					toast: "cn-toast"
				}
			}}
			{...props}
		/>
	);
};

export { Toaster };
