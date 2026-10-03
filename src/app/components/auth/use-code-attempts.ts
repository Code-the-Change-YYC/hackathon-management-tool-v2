"use client";

import { useState } from "react";
import { VERIFICATION_CODE_MAX_ATTEMPTS } from "@/lib/validation/auth";
import {
	AuthClientError,
	getAuthErrorMessage,
	hasAuthErrorCode
} from "./auth-errors";

const SPENT_CODE_MESSAGE =
	"This code no longer works. Resend the code to get a new one.";

/**
 * Tracks whether the emailed code can still work. better-auth deletes a code
 * once it expires or has been guessed wrong too many times, and from then on
 * every attempt, even with the right code, fails as if the code were wrong.
 * So once a code is used up, say so until a new one is sent.
 */
export function useCodeAttempts() {
	const [wrongAttempts, setWrongAttempts] = useState(0);
	const [isSpent, setIsSpent] = useState(false);

	/** The message for the code field after a failed attempt. */
	function getCodeErrorMessage(error: unknown) {
		if (hasAuthErrorCode(error, "OTP_EXPIRED", "TOO_MANY_ATTEMPTS")) {
			setIsSpent(true);
		} else if (hasAuthErrorCode(error, "INVALID_OTP")) {
			if (isSpent) return SPENT_CODE_MESSAGE;
			const attempts = wrongAttempts + 1;
			setWrongAttempts(attempts);
			if (attempts >= VERIFICATION_CODE_MAX_ATTEMPTS) {
				// That was the last try, so this code can't work any more.
				setIsSpent(true);
				return getAuthErrorMessage(
					new AuthClientError({ code: "TOO_MANY_ATTEMPTS", status: 403 })
				);
			}
		}
		return getAuthErrorMessage(error);
	}

	function onCodeResent() {
		setWrongAttempts(0);
		setIsSpent(false);
	}

	return {
		/** Set while the current code can't work, so there's no point sending it. */
		spentCodeMessage: isSpent ? SPENT_CODE_MESSAGE : undefined,
		getCodeErrorMessage,
		onCodeResent
	};
}
