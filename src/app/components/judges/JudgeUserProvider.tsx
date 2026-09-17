"use client";

import type { ReactNode } from "react";
import { JudgeUserContext } from "./useJudgePortalData";

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
