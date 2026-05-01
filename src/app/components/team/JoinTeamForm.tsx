"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/trpc/react";

const CODE_LENGTH = 4;

function isValidChar(char: string) {
	return /^[A-Za-z0-9]$/.test(char);
}

export default function JoinTeamForm() {
	const router = useRouter();
	const [chars, setChars] = useState<string[]>(Array(CODE_LENGTH).fill(""));
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	const joinTeam = api.teams.join.useMutation({
		onSuccess(data) {
			router.push(
				`/team/join/success?teamId=${data?.teamCode ?? ""}&teamName=${encodeURIComponent(data?.name ?? "")}`
			);
		}
	});

	const code = chars.join("").toUpperCase();
	const isFilled = code.length === CODE_LENGTH;
	const isDisabled = joinTeam.isPending || !isFilled;

	function handleChange(index: number, value: string) {
		if (value.length > 1) {
			const filtered = value
				.split("")
				.filter(isValidChar)
				.slice(0, CODE_LENGTH);
			const next = [...chars];
			for (let i = 0; i < filtered.length; i++) {
				const char = filtered[i];
				if (index + i < CODE_LENGTH && char !== undefined)
					next[index + i] = char.toUpperCase();
			}
			setChars(next);
			const focusIdx = Math.min(index + filtered.length, CODE_LENGTH - 1);
			inputRefs.current[focusIdx]?.focus();
			return;
		}

		const char = value.slice(-1);
		if (char && !isValidChar(char)) return;
		const next = [...chars];
		next[index] = char.toUpperCase();
		setChars(next);
		if (char && index < CODE_LENGTH - 1) {
			inputRefs.current[index + 1]?.focus();
		}
	}

	function handleKeyDown(
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>
	) {
		if (e.key === "Backspace") {
			if (chars[index]) {
				const next = [...chars];
				next[index] = "";
				setChars(next);
			} else if (index > 0) {
				inputRefs.current[index - 1]?.focus();
				const next = [...chars];
				next[index - 1] = "";
				setChars(next);
			}
		} else if (e.key === "ArrowLeft" && index > 0) {
			inputRefs.current[index - 1]?.focus();
		} else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
			inputRefs.current[index + 1]?.focus();
		}
	}

	function handlePaste(e: React.ClipboardEvent) {
		e.preventDefault();
		const text = e.clipboardData.getData("text");
		const filtered = text
			.split("")
			.filter(isValidChar)
			.slice(0, CODE_LENGTH)
			.map((c) => c.toUpperCase());
		const next = [...chars];
		for (let i = 0; i < filtered.length; i++) {
			const char = filtered[i];
			if (char !== undefined) next[i] = char;
		}
		setChars(next);
		const focusIdx = Math.min(filtered.length, CODE_LENGTH - 1);
		inputRefs.current[focusIdx]?.focus();
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (isDisabled) return;
		joinTeam.mutate({ teamCode: code });
	}

	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			<div className="flex flex-col items-center gap-4 rounded-2xl bg-pastel-pink/30 px-6 py-8">
				<p className="font-semibold text-sm text-strawberry-red">
					Enter 4-character Team ID
				</p>
				<div className="flex gap-3">
					{chars.map((char, i) => (
						<input
							autoCapitalize="characters"
							autoComplete="off"
							className="h-16 w-16 rounded-xl border-2 border-strawberry-red/40 bg-white text-center font-bold text-2xl text-dark-grey uppercase outline-none transition focus:border-awesomer-purple focus:ring-2 focus:ring-awesomer-purple/20 sm:h-20 sm:w-20 sm:text-3xl"
							disabled={joinTeam.isPending}
							inputMode="text"
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length positional input; order never changes
							key={i}
							maxLength={2}
							onChange={(e) => handleChange(i, e.target.value)}
							onKeyDown={(e) => handleKeyDown(i, e)}
							onPaste={handlePaste}
							ref={(el) => {
								inputRefs.current[i] = el;
							}}
							type="text"
							value={char}
						/>
					))}
				</div>
			</div>

			{joinTeam.error && (
				<p className="rounded-lg bg-pastel-pink px-4 py-2.5 text-sm text-strawberry-red">
					{joinTeam.error.message}
				</p>
			)}

			<div className="flex items-center justify-between pt-2">
				<button
					className="rounded-full bg-awesomer-purple px-6 py-2.5 font-semibold text-sm text-white transition hover:bg-awesome-purple"
					onClick={() => router.back()}
					type="button"
				>
					Back
				</button>
				<div className="flex gap-3">
					<Link
						className="rounded-full border border-awesomer-purple px-6 py-2.5 font-semibold text-awesomer-purple text-sm transition hover:bg-lilac-purple"
						href="/team"
					>
						Cancel
					</Link>
					<button
						className="rounded-full bg-awesomer-purple px-6 py-2.5 font-semibold text-sm text-white transition hover:bg-awesome-purple disabled:cursor-not-allowed disabled:opacity-50"
						disabled={isDisabled}
						type="submit"
					>
						{joinTeam.isPending ? "Joining…" : "Join"}
					</button>
				</div>
			</div>
		</form>
	);
}
