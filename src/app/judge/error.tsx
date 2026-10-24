"use client";

import PageError from "@/app/components/PageError";

export default function JudgeError({ retry }: { retry: () => void }) {
	return <PageError retry={retry} />;
}
