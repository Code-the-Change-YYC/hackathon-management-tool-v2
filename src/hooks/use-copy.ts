"use client";

import { useState } from "react";
import { tryCatch } from "@/lib/utils";

export function useCopy(resetMs = 2000) {
	const [copied, setCopied] = useState(false);

	async function copy(text: string) {
		const { error } = await tryCatch(navigator.clipboard.writeText(text));
		if (error) {
			setCopied(false);
			return;
		}
		setCopied(true);
		setTimeout(() => setCopied(false), resetMs);
	}

	return { copied, copy };
}
