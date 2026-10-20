import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServerTimeProvider, useCurrentTime } from "@/hooks/use-current-time";

function Clock() {
	return <span>{useCurrentTime().toISOString()}</span>;
}

afterEach(() => vi.useRealTimers());

describe("useCurrentTime", () => {
	it("hydrates with the server's time, then switches to the real clock", async () => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date("2026-11-07T09:00:00-06:00"));
		const tree = (
			<ServerTimeProvider time={Date.now()}>
				<Clock />
			</ServerTimeProvider>
		);
		const container = document.createElement("div");
		container.innerHTML = renderToString(tree);

		// Hydration a few minutes later can't change the rendered text.
		vi.setSystemTime(new Date("2026-11-07T09:02:00-06:00"));
		const onRecoverableError = vi.fn();
		await act(async () => {
			hydrateRoot(container, tree, { onRecoverableError });
		});

		expect(onRecoverableError).not.toHaveBeenCalled();
		expect(container.textContent).toBe("2026-11-07T15:02:00.000Z");
	});
});
