"use client";

import { createContext, type ReactNode, useContext } from "react";

type JudgeUser = { userId: string; userName: string };
const JudgeUserContext = createContext<JudgeUser | null>(null);

export function useJudgeUser() {
	const user = useContext(JudgeUserContext);
	if (!user) throw new Error("Judge portal user context is missing.");
	return user;
}

export function JudgeUserProvider({
	children,
	userId,
	userName
}: {
	children: ReactNode;
	userId: string;
	userName: string;
}) {
	return (
		<JudgeUserContext.Provider value={{ userId, userName }}>
			{children}
		</JudgeUserContext.Provider>
	);
}
