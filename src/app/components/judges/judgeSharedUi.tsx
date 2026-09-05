"use client";

import { VideoLine } from "@mingcute/react";
import type { ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

export function PageHeader({
	children,
	description,
	title
}: {
	children?: ReactNode;
	description: string;
	title: ReactNode;
}) {
	return (
		<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<h1 className="m-0 font-semibold text-[32px] leading-10">{title}</h1>
				<p className="m-0 text-[#575757] text-sm leading-5">{description}</p>
			</div>
			{children}
		</header>
	);
}

export function JoinMeetingButton({ href }: { href: string }) {
	if (!href) {
		return (
			<Button disabled type="button" variant="secondary">
				<VideoLine data-icon="inline-start" />
				Join Zoom Meeting
			</Button>
		);
	}

	return (
		<Button
			render={
				<a href={href} rel="noreferrer" target="_blank">
					<VideoLine data-icon="inline-start" />
					Join Zoom Meeting
				</a>
			}
		/>
	);
}

export function LoadingCard({
	label = "Loading judging information…"
}: {
	label?: string;
}) {
	return (
		<Card aria-live="polite">
			<CardContent className="flex min-h-56 flex-col justify-center gap-3">
				<Skeleton className="h-4 w-48" />
				<p className="m-0 text-muted-foreground text-sm">{label}</p>
			</CardContent>
		</Card>
	);
}

export function ErrorCard({ message }: { message: string }) {
	return (
		<Card>
			<CardContent>
				<p className="m-0 text-destructive">{message}</p>
			</CardContent>
		</Card>
	);
}
