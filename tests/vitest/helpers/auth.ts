import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import {
	createTestUser,
	getTestUserCookies,
	type TestUserOptions
} from "../../utils/auth";

export async function createAuthenticatedCaller(options: TestUserOptions = {}) {
	const { cleanup, user } = await createTestUser(options);
	const cookies = await getTestUserCookies(user.id, "127.0.0.1");
	const headers = new Headers({
		cookie: cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ")
	});

	return {
		caller: createCaller(() => createTRPCContext({ headers })),
		cleanup,
		user
	};
}

export const createUnauthenticatedCaller = () =>
	createCaller(() => createTRPCContext({ headers: new Headers() }));
