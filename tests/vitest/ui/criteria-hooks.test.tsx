import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	useCreateCriteria,
	useDeleteCriteria,
	useUpdateCriteria
} from "@/app/components/admin/criteriaTable/hooks";

const mocks = vi.hoisted(() => ({
	create: vi.fn(),
	delete: vi.fn(),
	refresh: vi.fn(),
	update: vi.fn()
}));

vi.mock("@/app/components/admin/criteriaTable/actions", () => ({
	createCriteria: mocks.create,
	deleteCriteria: mocks.delete,
	updateCriteria: mocks.update
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: mocks.refresh })
}));

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { mutations: { retry: false } }
	});

	return function QueryWrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.create.mockResolvedValue({ id: "created" });
	mocks.delete.mockResolvedValue({ success: true });
	mocks.update.mockResolvedValue({ id: "updated" });
});

describe("criteria mutation hooks", () => {
	it("creates criteria and refreshes the server-rendered table", async () => {
		const { result } = renderHook(() => useCreateCriteria(), {
			wrapper: createWrapper()
		});

		await act(async () => {
			await result.current.mutateAsync({ name: "Execution" });
		});

		expect(mocks.create).toHaveBeenCalledWith({ name: "Execution" });
		expect(mocks.refresh).toHaveBeenCalledOnce();
		await waitFor(() => expect(result.current.isSuccess).toBe(true));
	});

	it("exposes a native error when an update fails", async () => {
		mocks.update.mockRejectedValueOnce(new Error("Update failed"));
		const { result } = renderHook(() => useUpdateCriteria(), {
			wrapper: createWrapper()
		});

		await act(async () => {
			await expect(
				result.current.mutateAsync({ id: "criterion-id", name: "Updated" })
			).rejects.toThrow("Update failed");
		});

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error).toEqual(new Error("Update failed"));
		expect(mocks.refresh).not.toHaveBeenCalled();
	});

	it("deletes criteria and refreshes after success", async () => {
		const { result } = renderHook(() => useDeleteCriteria(), {
			wrapper: createWrapper()
		});

		await act(async () => {
			await result.current.mutateAsync({ id: "criterion-id" });
		});

		expect(mocks.delete).toHaveBeenCalledWith({ id: "criterion-id" });
		expect(mocks.refresh).toHaveBeenCalledOnce();
		expect(result.current.isPending).toBe(false);
	});
});
