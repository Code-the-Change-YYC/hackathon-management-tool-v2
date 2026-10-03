type AuthErrorDetails = { code?: string; message?: string; status: number };

/** A failed better-auth client call, keeping its error code for handling. */
export class AuthClientError extends Error {
	readonly code?: string;
	readonly status: number;

	constructor({ code, message, status }: AuthErrorDetails) {
		super(message || code || "Authentication request failed");
		this.name = "AuthClientError";
		this.code = code;
		this.status = status;
	}
}

/**
 * better-auth's client resolves with `{ data, error }` instead of throwing;
 * this throws the error so react-query's mutation states handle it.
 */
export function unwrapAuthResponse<TData>(response: {
	data: TData | null;
	error: AuthErrorDetails | null;
}) {
	if (response.error) throw new AuthClientError(response.error);
	return response.data as TData;
}

export function hasAuthErrorCode(error: unknown, ...codes: string[]) {
	return (
		error instanceof AuthClientError &&
		error.code !== undefined &&
		codes.includes(error.code)
	);
}

/** Errors that belong on a one-time code field rather than in a toast. */
export function isCodeError(error: unknown) {
	return (
		hasAuthErrorCode(
			error,
			"INVALID_OTP",
			"OTP_EXPIRED",
			"TOO_MANY_ATTEMPTS"
		) ||
		(error instanceof AuthClientError && error.status === 429)
	);
}

const MESSAGES: Record<string, string> = {
	INVALID_EMAIL: "Enter a valid email address",
	INVALID_EMAIL_OR_PASSWORD: "Incorrect email or password",
	INVALID_OTP: "That code isn’t right. Check your email and try again.",
	OTP_EXPIRED: "That code has expired. Resend the code to get a new one.",
	TOO_MANY_ATTEMPTS:
		"Too many incorrect attempts. Resend the code to get a new one.",
	PASSWORD_TOO_SHORT: "Use at least 8 characters",
	PASSWORD_TOO_LONG: "Use 128 characters or fewer"
};

export function getAuthErrorMessage(error: unknown) {
	if (error instanceof AuthClientError) {
		if (error.status === 429) {
			return "Too many attempts. Wait a minute, then try again.";
		}
		if (error.code && error.code in MESSAGES) return MESSAGES[error.code];
	}
	return "Something went wrong. Please try again.";
}
