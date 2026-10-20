"use client";

import PageError from "@/app/components/PageError";

export default function ParticipantError({ retry }: { retry: () => void }) {
	return <PageError retry={retry} />;
}
