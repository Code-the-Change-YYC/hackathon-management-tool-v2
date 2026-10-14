import {
	adminClient,
	emailOTPClient,
	inferAdditionalFields,
	organizationClient
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./config";

export const authClient = createAuthClient({
	plugins: [
		organizationClient(),
		adminClient(),
		emailOTPClient(),
		inferAdditionalFields<typeof auth>()
	]
});

export type Session = typeof authClient.$Infer.Session;
