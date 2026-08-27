"use client";

// Modal with a 6-box code entry (paste-friendly) for joining a team by code.

import {
	type ClipboardEvent,
	type KeyboardEvent,
	useRef,
	useState
} from "react";
import { Input } from "@/app/components/ui/input";
import { Modal, ModalTitle, PrimaryButton } from "./Modal";

const CODE_LENGTH = 6;
const CELL_IDS = Array.from(
	{ length: CODE_LENGTH },
	(_, index) => `cell-${index}`
);

export default function JoinCodeModal({
	open,
	onClose,
	onSubmit,
	error,
	loading
}: {
	open: boolean;
	onClose: () => void;
	onSubmit: (code: string) => void;
	error?: string | null;
	loading?: boolean;
}) {
	const [values, setValues] = useState<string[]>(Array(CODE_LENGTH).fill(""));
	const inputs = useRef<(HTMLInputElement | null)[]>([]);

	function setChar(index: number, char: string) {
		setValues((prev) => {
			const next = [...prev];
			next[index] = char;
			return next;
		});
	}

	function handleChange(index: number, raw: string) {
		const char = raw
			.replace(/[^a-zA-Z0-9]/g, "")
			.toUpperCase()
			.slice(-1);
		setChar(index, char);
		if (char && index < CODE_LENGTH - 1) {
			inputs.current[index + 1]?.focus();
		}
	}

	function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Backspace" && !values[index] && index > 0) {
			inputs.current[index - 1]?.focus();
		}
	}

	function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
		e.preventDefault();
		const pasted = e.clipboardData
			.getData("text")
			.replace(/[^a-zA-Z0-9]/g, "")
			.toUpperCase()
			.slice(0, CODE_LENGTH);
		if (!pasted) {
			return;
		}
		const next = Array(CODE_LENGTH).fill("");
		for (let i = 0; i < pasted.length; i++) {
			next[i] = pasted[i];
		}
		setValues(next);
		inputs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
	}

	const code = values.join("");
	const complete = code.length === CODE_LENGTH;

	return (
		<Modal onClose={onClose} open={open}>
			<div className="flex flex-col gap-2">
				<ModalTitle>Enter your team's Invite Code to join</ModalTitle>
				<p className="text-[16px] text-grey-600 leading-6">
					Your teammates can share a join code with you to invite members on
					their "My Team" page.
				</p>
			</div>

			<div className="flex flex-col items-center gap-2">
				<p className="font-medium text-[14px] text-grey-600">
					Team invite code
				</p>
				<div className="flex justify-center gap-2 sm:gap-3">
					{CELL_IDS.map((id, index) => (
						<Input
							aria-invalid={Boolean(error)}
							aria-label={`Invite code character ${index + 1}`}
							className="h-12 w-12 rounded-xl text-center font-medium text-[20px] sm:h-14 sm:w-14"
							inputMode="text"
							key={id}
							maxLength={1}
							onChange={(e) => handleChange(index, e.target.value)}
							onKeyDown={(e) => handleKeyDown(index, e)}
							onPaste={handlePaste}
							ref={(el) => {
								inputs.current[index] = el;
							}}
							value={values[index]}
						/>
					))}
				</div>
			</div>

			{error && (
				<p className="text-center font-medium text-[14px] text-red-700">
					{error}
				</p>
			)}

			<PrimaryButton
				disabled={!complete || loading}
				onClick={() => onSubmit(code)}
				type="button"
			>
				{loading ? "Checking..." : "Continue"}
			</PrimaryButton>
		</Modal>
	);
}
