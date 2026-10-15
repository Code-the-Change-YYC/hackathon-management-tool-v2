import {
	adminClient,
	emailOTPClient,
	inferAdditionalFields
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./config";

export const authClient = createAuthClient({
	plugins: [
		adminClient(),
		emailOTPClient(),
		inferAdditionalFields<typeof auth>()
	]
});

export type Session = typeof authClient.$Infer.Session;
