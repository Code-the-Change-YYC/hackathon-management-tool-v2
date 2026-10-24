"use client";

import PageError from "@/app/components/PageError";

export default function AdminError({ retry }: { retry: () => void }) {
	return <PageError retry={retry} />;
}
