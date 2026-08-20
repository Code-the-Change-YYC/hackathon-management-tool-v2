"use client";

import { CheckLine, CloseLine, EyeCloseLine, EyeLine } from "@mingcute/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { cn } from "@/lib/utils";

const backgrounds = {
	food: "/auth/sign-up-background.png",
	profile: "/auth/sign-up-background.png",
	signup: "/auth/sign-up-background.png"
} as const;

type AuthShellProps = {
	background?: keyof typeof backgrounds;
	children: React.ReactNode;
};

type PasswordInputProps = {
	disabled?: boolean;
	id: string;
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	value: string;
};

type PasswordRequirement = {
	label: string;
	met: boolean;
};

export function AuthShell({ background = "signup", children }: AuthShellProps) {
	return (
		<main className="relative min-h-svh overflow-hidden bg-pale-grey text-dark-grey">
			<div
				aria-hidden="true"
				className="absolute inset-0 hidden bg-center bg-cover lg:block"
				style={{ backgroundImage: `url(${backgrounds[background]})` }}
			/>
			<section className="relative flex min-h-svh w-full max-w-160 flex-col bg-pale-grey px-6 py-10 sm:px-12 lg:px-24 lg:py-12">
				<div className="mb-6 flex justify-center">
					<Image
						alt="Hack the Change"
						className="h-22.5 w-43.25"
						height={90}
						src="/auth/logo.svg"
						width={173}
					/>
				</div>
				{children}
			</section>
		</main>
	);
}

export function AuthHeading({ children }: { children: React.ReactNode }) {
	return <h1 className="font-semibold text-[28px] leading-9">{children}</h1>;
}

export function AuthDivider() {
	return (
		<div aria-hidden="true" className="flex items-center gap-4">
			<Separator className="h-0.5 flex-1 bg-medium-grey" />
			<span className="font-medium text-medium-grey text-sm">OR</span>
			<Separator className="h-0.5 flex-1 bg-medium-grey" />
		</div>
	);
}

export function GoogleAuthButton({
	disabled,
	label,
	onClick
}: {
	disabled?: boolean;
	label: string;
	onClick: () => void;
}) {
	return (
		<Button
			className="h-11 w-full rounded-xl"
			disabled={disabled}
			onClick={onClick}
			type="button"
			variant="outline"
		>
			<Image
				alt=""
				aria-hidden="true"
				className="size-5"
				height={20}
				src="/auth/google.svg"
				width={20}
			/>
			{label}
		</Button>
	);
}

export function PasswordInput({
	disabled,
	id,
	onChange,
	placeholder = "Password",
	value
}: PasswordInputProps) {
	const [visible, setVisible] = useState(false);

	return (
		<div className="relative">
			<input
				className="h-12 w-full rounded-xl border border-ehhh-grey bg-pale-grey px-4 pr-12 text-base outline-none transition focus-visible:border-awesomer-purple focus-visible:ring-3 focus-visible:ring-awesome-purple/30 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={disabled}
				id={id}
				onChange={onChange}
				placeholder={placeholder}
				required
				type={visible ? "text" : "password"}
				value={value}
			/>
			<button
				aria-label={visible ? "Hide password" : "Show password"}
				className="-translate-y-1/2 absolute top-1/2 right-3 flex size-8 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-awesome-purple/30"
				disabled={disabled}
				onClick={() => setVisible((current) => !current)}
				type="button"
			>
				{visible ? (
					<EyeCloseLine aria-hidden="true" className="size-4" />
				) : (
					<EyeLine aria-hidden="true" className="size-4" />
				)}
			</button>
		</div>
	);
}

export function PasswordRequirements({
	requirements
}: {
	requirements: PasswordRequirement[];
}) {
	return (
		<ul aria-live="polite" className="flex flex-col gap-1">
			{requirements.map(({ label, met }) => (
				<li
					className={cn(
						"flex items-center gap-1 text-[11px] leading-4",
						met ? "text-emerald-green" : "text-grey-purple"
					)}
					key={label}
				>
					{met ? (
						<CheckLine aria-hidden="true" className="size-3" />
					) : (
						<CloseLine aria-hidden="true" className="size-3" />
					)}
					{label}
				</li>
			))}
		</ul>
	);
}

export function AuthFooterLink({
	href,
	label,
	prefix
}: {
	href: string;
	label: string;
	prefix: string;
}) {
	return (
		<p className="flex flex-wrap items-center justify-center gap-1 text-center font-medium text-sm">
			<span>{prefix}</span>
			<Link
				className="px-1 text-awesomer-purple underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-awesome-purple/30"
				href={href}
			>
				{label}
			</Link>
		</p>
	);
}
