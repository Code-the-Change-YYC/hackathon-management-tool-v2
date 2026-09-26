import {
	act,
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";

function Harness({ onResult }: { onResult: (result: boolean) => void }) {
	const { confirm, dialogProps } = useConfirmDialog();
	return (
		<>
			<button
				onClick={async () =>
					onResult(
						await confirm({
							title: "Delete room?",
							description: "Remove this unscored room.",
							confirmLabel: "Delete",
							destructive: true
						})
					)
				}
				type="button"
			>
				Open confirmation
			</button>
			<ConfirmAlertDialog {...dialogProps} />
		</>
	);
}

describe("judging confirmations", () => {
	it("cancels without authorizing deletion, then supports a fresh confirmation", async () => {
		const onResult = vi.fn();
		render(<Harness onResult={onResult} />);
		fireEvent.click(screen.getByText("Open confirmation"));
		expect(await screen.findByRole("alertdialog")).toHaveAccessibleName(
			"Delete room?"
		);
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(false));
		fireEvent.click(screen.getByText("Open confirmation"));
		fireEvent.click(await screen.findByRole("button", { name: "Delete" }));
		await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(true));
		expect(onResult).toHaveBeenCalledTimes(2);
	});
	it("settles pending requests on unmount and does not replace an open request", async () => {
		const { result, unmount } = renderHook(useConfirmDialog);
		let pending: Promise<boolean> = Promise.resolve(true);
		act(() => {
			pending = result.current.confirm({
				title: "First",
				description: "First request"
			});
		});
		await expect(
			result.current.confirm({ title: "Second", description: "Second request" })
		).resolves.toBe(false);
		unmount();
		await expect(pending).resolves.toBe(false);
	});
});
