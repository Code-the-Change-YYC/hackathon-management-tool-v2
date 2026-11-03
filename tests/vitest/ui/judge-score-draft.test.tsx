import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Criterion } from "@/app/components/judge/judgePortal";
import { useJudgeScoreDraft } from "@/app/components/judge/score/useJudgeScoreDraft";

const criteria: [Criterion] = [
	{
		id: "main",
		name: "Innovation",
		description: "Originality",
		maxScore: 10,
		displayOrder: 0,
		isSidepot: false
	}
];
const input = {
	userId: "judge-a",
	assignmentId: "assignment",
	criteria,
	savedScores: [] as { criteriaId: string; value: number }[],
	ready: true
};
beforeEach(() => {
	localStorage.clear();
	vi.restoreAllMocks();
});

describe("judge score drafts", () => {
	it("waits for saved scores before restoring or editing", () => {
		const { result, rerender } = renderHook(
			(ready) => useJudgeScoreDraft({ ...input, ready }),
			{ initialProps: false }
		);
		expect(result.current.initialized).toBe(false);
		rerender(true);
		expect(result.current.initialized).toBe(true);
	});
	it("restores a zero-valued draft across page mounts and isolates users and assignments", () => {
		const first = renderHook(() => useJudgeScoreDraft(input));
		act(() => first.result.current.updateScore("main", 0));
		first.unmount();
		const restored = renderHook(() => useJudgeScoreDraft(input));
		expect(restored.result.current.scores).toEqual({ main: 0 });
		expect(restored.result.current.dirty).toBe(true);
		expect(restored.result.current.notice).toBe("");
		const anotherJudge = renderHook(() =>
			useJudgeScoreDraft({ ...input, userId: "judge-b" })
		);
		const anotherTeam = renderHook(() =>
			useJudgeScoreDraft({ ...input, assignmentId: "other" })
		);
		expect(anotherJudge.result.current.scores).toEqual({});
		expect(anotherTeam.result.current.scores).toEqual({});
	});
	it("does not replace newer submitted scores with an older draft", () => {
		const first = renderHook(() => useJudgeScoreDraft(input));
		act(() => first.result.current.updateScore("main", 4));
		first.unmount();
		const { result } = renderHook(() =>
			useJudgeScoreDraft({
				...input,
				savedScores: [{ criteriaId: "main", value: 9 }]
			})
		);
		expect(result.current.scores).toEqual({ main: 9 });
		expect(result.current.notice).toMatch(/newer scores/);
	});
	it("rejects drafts after rubric changes", () => {
		const first = renderHook(() => useJudgeScoreDraft(input));
		act(() => first.result.current.updateScore("main", 9));
		first.unmount();
		const { result } = renderHook(() =>
			useJudgeScoreDraft({
				...input,
				criteria: [{ ...criteria[0], maxScore: 5 }]
			})
		);
		expect(result.current.scores).toEqual({});
		expect(result.current.notice).toMatch(/rubric changed/);
	});
	it("recovers from corrupt and expired drafts", () => {
		localStorage.setItem("judge-score-draft:judge-a:assignment", "broken json");
		const corrupt = renderHook(() => useJudgeScoreDraft(input));
		expect(corrupt.result.current.scores).toEqual({});
		expect(corrupt.result.current.storageAvailable).toBe(true);
		corrupt.unmount();
		const first = renderHook(() => useJudgeScoreDraft(input));
		act(() => first.result.current.updateScore("main", 4));
		first.unmount();
		vi.spyOn(Date, "now").mockReturnValue(Date.now() + 8 * 86400000);
		const expired = renderHook(() => useJudgeScoreDraft(input));
		expect(expired.result.current.scores).toEqual({});
	});
	it("keeps in-memory answers and warns when device persistence fails", () => {
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("Quota exceeded");
		});
		const { result } = renderHook(() => useJudgeScoreDraft(input));
		act(() => result.current.updateScore("main", 7));
		expect(result.current.scores).toEqual({ main: 7 });
		expect(result.current.storageAvailable).toBe(false);
		expect(result.current.notice).toMatch(/Keep this page open/);
		const event = new Event("beforeunload", { cancelable: true });
		window.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
	});
	it("clears a selection without treating zero as unanswered and removes a reverted draft", () => {
		const { result } = renderHook(() => useJudgeScoreDraft(input));
		act(() => result.current.updateScore("main", 0));
		expect(result.current.scores).toEqual({ main: 0 });
		act(() => result.current.updateScore("main", undefined));
		expect(result.current.scores).toEqual({});
		expect(result.current.dirty).toBe(false);
		expect(localStorage.length).toBe(0);
	});

	it("clears the device draft only when explicitly acknowledged as submitted", () => {
		const { result } = renderHook(() => useJudgeScoreDraft(input));
		act(() => result.current.updateScore("main", 8));
		expect(localStorage.length).toBe(1);
		act(() => result.current.clearDraft());
		expect(localStorage.length).toBe(0);
		expect(result.current.dirty).toBe(false);
	});
});
